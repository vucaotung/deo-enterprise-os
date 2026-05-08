import { RuntimeAdapter } from './types';

export const openclawAdapter: RuntimeAdapter = {
  name: 'openclaw',
  async run(ctx) {
    const message = 'openclaw adapter is not configured for execution yet';
    const lines = [
      `[openclaw] agent_job=${ctx.id} task="${String(ctx.task.title).replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')}"`,
      `[openclaw] ${message}`,
    ];
    return {
      status: 'failed',
      output: { stub: 'openclaw', task_title: ctx.task.title },
      error: { message },
      log_tail: lines.join('\n') + '\n',
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    };
  },
};
