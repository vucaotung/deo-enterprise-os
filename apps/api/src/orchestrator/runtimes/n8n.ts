import { RuntimeAdapter } from './types';

export const n8nAdapter: RuntimeAdapter = {
  name: 'n8n',
  async run(ctx) {
    // Stub: real adapter triggers the n8n workflow referenced by
    // workflow_definitions.n8n_entrypoint_url and resolves on the
    // workflow's webhook callback. Tracked separately.
    const lines = [
      `[n8n] agent_job=${ctx.id} task="${ctx.task.title}"`,
      `[n8n] stub adapter — would trigger n8n workflow webhook`,
    ];
    return {
      status: 'succeeded',
      output: { stub: 'n8n', task_title: ctx.task.title },
      log_tail: lines.join('\n') + '\n',
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    };
  },
};
