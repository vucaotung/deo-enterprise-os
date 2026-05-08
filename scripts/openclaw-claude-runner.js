#!/usr/bin/env node
/*
 * OpenClaw local Claude Code runner for Enterprise OS.
 * Polls VPS control plane, claims claude-code jobs, runs local Claude Code CLI,
 * then callbacks status/logs. Designed for machine that has Claude Code auth + repo.
 */
const { spawn } = require('child_process');
const path = require('path');

const API_URL = (process.env.ENTERPRISE_OS_API_URL || 'https://api.enterpriseos.bond/api').replace(/\/$/, '');
const TOKEN = process.env.ENTERPRISE_OS_MCP_TOKEN || process.env.AGENT_RUNNER_TOKEN;
const RUNTIME_TYPE = process.env.AGENT_RUNTIME_TYPE || 'claude-code';
const COMPANY_ID = process.env.AGENT_COMPANY_ID || 'b1f6384d-4ac0-40f1-91b9-95b8cfeb0712';
const AGENT_ID = process.env.AGENT_ID || '';
const WORKDIR_ROOT = path.resolve(process.env.CLAUDE_CODE_WORKDIR_ROOT || process.cwd());
const CLAUDE_COMMAND = process.env.CLAUDE_CODE_COMMAND || (process.platform === 'win32' ? 'claude.exe' : 'claude');
const POLL_MS = Number(process.env.AGENT_RUNNER_POLL_MS || 5000);
const DEFAULT_TIMEOUT_MS = Number(process.env.CLAUDE_CODE_TIMEOUT_MS || 10 * 60 * 1000);
const LOG_MAX = 16000;

if (!TOKEN) {
  console.error('Missing ENTERPRISE_OS_MCP_TOKEN or AGENT_RUNNER_TOKEN');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const trim = (value) => String(value || '').slice(-LOG_MAX);
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Service-Token': TOKEN,
});

const apiFetch = async (pathName, options = {}) => {
  const res = await fetch(`${API_URL}${pathName}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error || data?.message || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return data;
};

const resolveWorkdir = (job) => {
  const configured = job.agent?.config?.workdir || job.input?.workdir || WORKDIR_ROOT;
  const requested = path.resolve(configured);
  const relative = path.relative(WORKDIR_ROOT, requested);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return requested;
  throw new Error(`workdir ${requested} outside CLAUDE_CODE_WORKDIR_ROOT ${WORKDIR_ROOT}`);
};

const buildPrompt = (job) => [
  'You are it-dev-agent running locally via OpenClaw for Enterprise OS.',
  'Source of truth is the webapp/API; report status through agent_jobs callback.',
  '',
  `agent_job_id: ${job.id}`,
  `execution_id: ${job.execution_id}`,
  `task_id: ${job.task_id}`,
  `task_title: ${job.task?.title || ''}`,
  '',
  'Task description:',
  job.task?.description || '(none)',
  '',
  'Agent input JSON:',
  JSON.stringify(job.input || {}, null, 2),
  '',
  'Do the requested coding work in this repository. Build/test when appropriate. Commit changes if code changed. Do not deploy unless task explicitly asks.',
].join('\n');

const patchStatus = (jobId, body) => apiFetch(`/agent-runner/jobs/${jobId}/status`, {
  method: 'PATCH',
  body: JSON.stringify(body),
});

const appendLog = async (jobId, line) => {
  try {
    await apiFetch(`/agent-runner/jobs/${jobId}/logs`, {
      method: 'POST',
      body: JSON.stringify({ line }),
    });
  } catch (error) {
    console.error('append log failed:', error.message);
  }
};

const runClaude = (job) => new Promise((resolve) => {
  const workdir = resolveWorkdir(job);
  const timeoutMs = Number(job.input?.timeout_ms || job.agent?.config?.timeout_ms || DEFAULT_TIMEOUT_MS);
  const args = ['--permission-mode', 'bypassPermissions', '--print'];
  const prompt = buildPrompt(job);
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  const started = Date.now();

  const child = spawn(CLAUDE_COMMAND, args, {
    cwd: workdir,
    shell: false,
    windowsHide: true,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.stdin.end(prompt);
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 5000).unref();
  }, Math.max(1000, Math.min(timeoutMs, 60 * 60 * 1000)));

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdout = trim(stdout + text);
    process.stdout.write(text);
  });
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderr = trim(stderr + text);
    process.stderr.write(text);
  });
  child.on('error', (error) => {
    clearTimeout(timer);
    resolve({ status: 'failed', stdout, stderr, exit_code: null, duration_ms: Date.now() - started, error: error.message, workdir });
  });
  child.on('close', (code, signal) => {
    clearTimeout(timer);
    const ok = !timedOut && code === 0;
    resolve({
      status: ok ? 'succeeded' : 'failed',
      stdout,
      stderr,
      exit_code: code,
      signal,
      duration_ms: Date.now() - started,
      error: ok ? null : timedOut ? `Claude Code timed out after ${timeoutMs}ms` : `Claude Code exited with code ${code}${signal ? ` signal ${signal}` : ''}`,
      workdir,
    });
  });
});

const claim = () => apiFetch('/agent-runner/claim', {
  method: 'POST',
  body: JSON.stringify({ runtime_type: RUNTIME_TYPE, company_id: COMPANY_ID || undefined, agent_id: AGENT_ID || undefined }),
});

const runOnce = async () => {
  const claimed = await claim();
  if (!claimed?.job) return false;
  const job = claimed.job;
  console.log(`claimed job ${job.id}: ${job.task?.title || ''}`);
  await patchStatus(job.id, { queue_state: 'running' });
  await appendLog(job.id, `[local-runner] claimed on ${require('os').hostname()}`);
  const result = await runClaude(job);
  const queue_state = result.status === 'succeeded' ? 'done' : 'dead';
  await patchStatus(job.id, {
    queue_state,
    output: result,
    error: result.error ? { message: result.error } : undefined,
    log_tail: [`[local-runner] workdir=${result.workdir}`, result.stdout, result.stderr, result.error || ''].filter(Boolean).join('\n'),
  });
  console.log(`finished job ${job.id}: ${queue_state}`);
  return true;
};

const main = async () => {
  console.log(`Enterprise OS local runner online: ${API_URL}, runtime=${RUNTIME_TYPE}`);
  while (true) {
    try {
      await runOnce();
    } catch (error) {
      console.error('runner error:', error.message);
    }
    await sleep(POLL_MS);
  }
};

main();
