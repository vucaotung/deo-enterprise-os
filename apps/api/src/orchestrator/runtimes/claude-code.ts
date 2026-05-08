import { spawn } from 'child_process';
import { RuntimeAdapter, AgentJobContext, RuntimeRunResult } from './types';

const LOG_TAIL_MAX = 16384;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

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

const buildPrompt = (ctx: AgentJobContext): string => {
  const instruction = asString(ctx.input?.prompt) || asString(ctx.input?.instruction) || '';
  const parts = [
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
  ];

  if (instruction) {
    parts.push('', 'Additional instruction:', instruction);
  }

  parts.push('', 'Do the requested work. Be concise in final output.');
  return parts.join('\n');
};

const runClaude = (ctx: AgentJobContext): Promise<RuntimeRunResult> => {
  const config = ctx.agent?.config || {};
  const cli = asString(config.cli) || asString(ctx.input?.cli) || 'claude';
  const workdir = asString(config.workdir) || asString(ctx.input?.workdir) || process.cwd();
  const timeoutMs = asNumber(ctx.input?.timeout_ms) || asNumber(config.timeout_ms) || DEFAULT_TIMEOUT_MS;
  const extraArgs = Array.isArray(config.args) ? config.args.filter((arg): arg is string => typeof arg === 'string') : [];
  const prompt = buildPrompt(ctx);
  const args = extraArgs.length > 0
    ? [...extraArgs, prompt]
    : ['--permission-mode', 'bypassPermissions', '--print', prompt];

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(cli, args, {
      cwd: workdir,
      shell: process.platform === 'win32',
      env: process.env,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdout = clampLog(stdout + chunk.toString());
    });

    child.stderr?.on('data', (chunk) => {
      stderr = clampLog(stderr + chunk.toString());
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      const message = `Failed to start Claude Code CLI: ${error.message}`;
      resolve({
        status: 'failed',
        error: { message, details: { cli, workdir } },
        output: { cli, workdir, error: message },
        log_tail: clampLog([stdout, stderr, message].filter(Boolean).join('\n')),
      });
    });

    child.on('close', (code, signal) => {
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
          cli,
          workdir,
          exit_code: exitCode,
          signal,
          duration_ms: durationMs,
          stdout,
          stderr,
        },
        error: message ? { message, details: { exit_code: exitCode, signal, timed_out: timedOut } } : null,
        log_tail: clampLog([
          `[claude-code] agent_job=${ctx.id} task="${ctx.task.title}"`,
          `[claude-code] cwd=${workdir}`,
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
