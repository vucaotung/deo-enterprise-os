import { RuntimeAdapter } from './types';

export const n8nAdapter: RuntimeAdapter = {
  name: 'n8n',
  async run(ctx) {
    const message = 'n8n adapter is not configured for execution yet';
    const lines = [
      `[n8n] agent_job=${ctx.id} task="${String(ctx.task.title).replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')}"`,
      `[n8n] ${message}`,
    ];
    return {
      status: 'failed',
      output: { stub: 'n8n', task_title: ctx.task.title },
      error: { message },
      log_tail: lines.join('\n') + '\n',
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    };
  },
};
