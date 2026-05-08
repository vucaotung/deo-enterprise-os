import { RuntimeAdapter } from './types';

export const openclawAdapter: RuntimeAdapter = {
  name: 'openclaw',
  async run(ctx) {
    // Stub: real adapter posts to the openclaw HTTP endpoint configured
    // on deo.agents.config and waits for callback via PATCH
    // /api/agent-jobs/:id/status. Tracked separately.
    const lines = [
      `[openclaw] agent_job=${ctx.id} task="${ctx.task.title}"`,
      `[openclaw] stub adapter — would POST to openclaw HTTP endpoint`,
    ];
    return {
      status: 'succeeded',
      output: { stub: 'openclaw', task_title: ctx.task.title },
      log_tail: lines.join('\n') + '\n',
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    };
  },
};
