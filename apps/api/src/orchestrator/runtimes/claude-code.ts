import { RuntimeAdapter } from './types';

export const claudeCodeAdapter: RuntimeAdapter = {
  name: 'claude-code',
  async run(ctx) {
    // Stub: real adapter spawns the Claude Code CLI with the task as a
    // prompt and pipes output back. Tracked separately.
    const lines = [
      `[claude-code] agent_job=${ctx.id} task="${ctx.task.title}"`,
      `[claude-code] stub adapter — would spawn claude-code CLI here`,
    ];
    return {
      status: 'succeeded',
      output: { stub: 'claude-code', task_title: ctx.task.title },
      log_tail: lines.join('\n') + '\n',
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    };
  },
};
