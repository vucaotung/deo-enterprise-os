import { spawn } from 'child_process';
import path from 'path';
import { RuntimeAdapter, AgentJobContext, RuntimeRunResult } from './types';

const LOG_TAIL_MAX = 16384;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 60 * 60 * 1000;
const WORKDIR_ROOT = path.resolve(process.env.CLAUDE_CODE_WORKDIR_ROOT || process.cwd());
const SECRET_PATTERN = /(sk-[A-Za-z0-9_-]+|(?:api[_-]?key|token|password|secret)\s*[:=]\s*[^\s"']+)/gi;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const clampLog = (text: string): string =>
  text.length <= LOG_TAIL_MAX ? text : text.slice(text.length - LOG_TAIL_MAX);

const redact = (value: string): string => value.replace(SECRET_PATTERN, '[REDACTED]');

const sanitizeLogField = (value: unknown): string =>
  redact(String(value ?? ''))
    .replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')
    .slice(0, 500);

const sanitizeOutput = (value: string): string => clampLog(redact(value));

const resolveWorkdir = (ctx: AgentJobContext): string => {
  const requested = path.resolve(asString(ctx.agent?.config?.workdir) || process.cwd());
  const relative = path.relative(WORKDIR_ROOT, requested);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return requested;
  throw new Error(`Agent workdir must be under ${WORKDIR_ROOT}`);
};

const resolveTimeoutMs = (ctx: AgentJobContext): number => {
  const rawTimeout = asNumber(ctx.agent?.config?.timeout_ms) ?? asNumber(ctx.input?.timeout_ms) ?? DEFAULT_TIMEOUT_MS;
  const timeoutMs = Math.trunc(rawTimeout);
  if (timeoutMs < MIN_TIMEOUT_MS) return MIN_TIMEOUT_MS;
  if (timeoutMs > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return timeoutMs;
};

const buildPrompt = (ctx: AgentJobContext): string =>
  [
    'You are an Enterprise OS coding/runtime agent invoked from the webapp control plane.',
    '',
    `agent_job_id: ${ctx.id}`,
    `execution_id: ${ctx.execution_id}`,
    `task_id: ${ctx.task_id}`,
    `task_title: ${ctx.task.title}`,
    '',
    'Task description:',
    ctx.task.description || '(none)',
    '',
    'Agent input JSON:',
    JSON.stringify(ctx.input || {}, null, 2),
    '',
    'Do the requested work. Be concise in final output.',
  ].join('\n');

const runClaude = (ctx: AgentJobContext): Promise<RuntimeRunResult> => {
  const workdir = resolveWorkdir(ctx);
  const timeoutMs = resolveTimeoutMs(ctx);
  const prompt = buildPrompt(ctx);
  const args = ['--permission-mode', 'bypassPermissions', '--print', prompt];

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const child = spawn('claude', args, {
      cwd: workdir,
      shell: false,
      env: process.env,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdout = sanitizeOutput(stdout + chunk.toString());
    });

    child.stderr?.on('data', (chunk) => {
      stderr = sanitizeOutput(stderr + chunk.toString());
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const message = `Failed to start Claude Code CLI: ${error.message}`;
      resolve({
        status: 'failed',
        error: { message, details: { workdir } },
        output: { stdout, stderr, exit_code: null, error: message },
        log_tail: clampLog([stdout, stderr, message].filter(Boolean).join('\n')),
      });
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const durationMs = Date.now() - startedAt;
      const exitCode = code ?? null;
      const success = !timedOut && exitCode === 0;
      const message = timedOut
        ? `Claude Code timed out after ${timeoutMs}ms`
        : success
          ? undefined
          : `Claude Code exited with code ${exitCode}${signal ? ` signal ${signal}` : ''}`;

      resolve({
        status: success ? 'succeeded' : 'failed',
        output: {
          stdout,
          stderr,
          exit_code: exitCode,
          signal,
          duration_ms: durationMs,
        },
        error: message ? { message, details: { exit_code: exitCode, signal, timed_out: timedOut } } : null,
        log_tail: clampLog([
          `[claude-code] agent_job=${sanitizeLogField(ctx.id)} task="${sanitizeLogField(ctx.task.title)}"`,
          `[claude-code] cwd=${sanitizeLogField(workdir)} timeout_ms=${timeoutMs}`,
          stdout,
          stderr,
          message || '',
        ].filter(Boolean).join('\n')),
        tokens_in: 0,
        tokens_out: 0,
        cost_usd: 0,
      });
    });
  });
};

export const claudeCodeAdapter: RuntimeAdapter = {
  name: 'claude-code',
  run: runClaude,
};
