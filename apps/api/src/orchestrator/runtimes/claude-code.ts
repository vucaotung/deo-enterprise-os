import { spawn } from 'child_process';
import { RuntimeAdapter, AgentJobContext, RuntimeRunResult } from './types';

const LOG_TAIL_MAX = 16384;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 60 * 60 * 1000;

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

const sanitizeLogField = (value: unknown): string =>
  String(value ?? '')
    .replace(/[][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '')
    .replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')
    .slice(0, 500);

const resolveTimeoutMs = (ctx: AgentJobContext): number => {
  const rawTimeout = asNumber(ctx.agent?.config?.timeout_ms) ?? asNumber(ctx.input?.timeout_ms) ?? DEFAULT_TIMEOUT_MS;
  const timeoutMs = Math.trunc(rawTimeout);
  if (timeoutMs < MIN_TIMEOUT_MS) return MIN_TIMEOUT_MS;
  if (timeoutMs > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return timeoutMs;
};

const buildPrompt = (ctx: AgentJobContext): string => {
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
    '',
    'Do the requested work. Be concise in final output.',
  ];

  return parts.join('\n');
};

const runClaude = (ctx: AgentJobContext): Promise<RuntimeRunResult> => {
  const workdir = asString(ctx.agent?.config?.workdir) || process.cwd();
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
      stdout = clampLog(stdout + chunk.toString());
    });

    child.stderr?.on('data', (chunk) => {
      stderr = clampLog(stderr + chunk.toString());
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
