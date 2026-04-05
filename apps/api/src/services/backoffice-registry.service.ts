import { query as dbQuery } from '../db';

export interface WorkflowDefinitionRecord {
  id: string;
  workflow_key: string;
  name: string;
  description: string;
  purpose: string;
  domain_type: string;
  trigger_mode: string;
  execution_style: string;
  suitable_for_agents: string[];
  allowed_context_types: string[];
  allowed_actions: string[];
  input_schema_key?: string;
  callback_schema_key?: string;
  n8n_entrypoint_url?: string;
  lifecycle_status: string;
  rollout_stage: string;
  is_enabled: boolean;
}

class BackofficeRegistryService {
  async getWorkflowByKey(workflowKey: string): Promise<WorkflowDefinitionRecord | null> {
    const result = await dbQuery(
      `SELECT * FROM deo.workflow_definitions WHERE workflow_key = $1 LIMIT 1`,
      [workflowKey],
    );

    return result.rows[0] || null;
  }

  async listBackofficeWorkflows(): Promise<WorkflowDefinitionRecord[]> {
    const result = await dbQuery(
      `SELECT * FROM deo.workflow_definitions WHERE domain_type = 'files' ORDER BY workflow_key ASC`,
    );

    return result.rows;
  }

  async ensureWorkflowEnabled(workflowKey: string): Promise<WorkflowDefinitionRecord> {
    const workflow = await this.getWorkflowByKey(workflowKey);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowKey}`);
    }
    if (!workflow.is_enabled) {
      throw new Error(`Workflow disabled: ${workflowKey}`);
    }
    return workflow;
  }
}

export const backofficeRegistryService = new BackofficeRegistryService();
