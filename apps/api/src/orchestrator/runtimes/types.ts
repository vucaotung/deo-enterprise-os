export interface AgentJobContext {
  id: string;
  execution_id: string;
  task_id: string;
  agent_id?: string | null;
  runtime_type: string;
  input: Record<string, unknown>;
  task: {
    id: string;
    title: string;
    description?: string | null;
    company_id: string;
  };
}

export interface RuntimeRunResult {
  status: 'succeeded' | 'failed';
  output?: Record<string, unknown> | null;
  error?: { message: string; details?: unknown } | null;
  log_tail?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
}

export interface RuntimeAdapter {
  name: string;
  /**
   * PR3 ships stubs that return mock success. Real adapters will wire to
   * Claude Code subprocess, openclaw HTTP, n8n webhook, and internal handlers
   * in a follow-up PR.
   */
  run(ctx: AgentJobContext): Promise<RuntimeRunResult>;
}
