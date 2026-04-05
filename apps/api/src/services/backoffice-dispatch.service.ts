import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { backofficeRegistryService } from './backoffice-registry.service';

export interface DispatchBackofficeWorkflowInput {
  workflow_key: string;
  objective: string;
  context?: Record<string, any>;
  payload?: Record<string, any>;
  reviewers?: string[];
  invoked_by_type?: 'human' | 'agent' | 'system';
  invoked_by_id?: string;
}

class BackofficeDispatchService {
  async dispatch(input: DispatchBackofficeWorkflowInput) {
    const workflow = await backofficeRegistryService.ensureWorkflowEnabled(input.workflow_key);

    const invocationId = uuidv4();
    const dispatchPayload = {
      invocation_id: invocationId,
      workflow_key: workflow.workflow_key,
      objective: input.objective,
      context: input.context || {},
      payload: input.payload || {},
      reviewers: input.reviewers || [],
      invoked_by_type: input.invoked_by_type || 'human',
      invoked_by_id: input.invoked_by_id || null,
      callback_url: process.env.BACKOFFICE_CALLBACK_URL || '/api/backoffice/workflows/callback',
    };

    const entrypoint = workflow.n8n_entrypoint_url || process.env.BACKOFFICE_N8N_WEBHOOK_URL || null;

    if (!entrypoint) {
      return {
        invocation_id: invocationId,
        workflow_key: workflow.workflow_key,
        dispatch_status: 'queued',
        dispatched_to: null,
        payload: dispatchPayload,
      };
    }

    await axios.post(entrypoint, dispatchPayload, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.BACKOFFICE_N8N_API_KEY
          ? { Authorization: `Bearer ${process.env.BACKOFFICE_N8N_API_KEY}` }
          : {}),
      },
      timeout: 15000,
    });

    return {
      invocation_id: invocationId,
      workflow_key: workflow.workflow_key,
      dispatch_status: 'dispatched',
      dispatched_to: entrypoint,
      payload: dispatchPayload,
    };
  }
}

export const backofficeDispatchService = new BackofficeDispatchService();
