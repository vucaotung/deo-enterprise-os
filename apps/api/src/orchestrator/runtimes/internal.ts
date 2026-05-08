import { RuntimeAdapter } from './types';

export const internalAdapter: RuntimeAdapter = {
  name: 'internal',
  async run(ctx) {
    const lines = [
      `[internal] agent_job=${ctx.id} task="${ctx.task.title}"`,
      `[internal] stub adapter — no real work performed`,
      `[internal] echoing input keys: ${Object.keys(ctx.input).join(', ') || '(none)'}`,
    ];
    const message = 'internal adapter is not configured for execution yet';
    return {
      status: 'failed',
      output: { stub: 'internal', input_keys: Object.keys(ctx.input) },
      error: { message },
      log_tail: [...lines, `[internal] ${message}`].join('\n') + '\n',
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    };
  },
};
