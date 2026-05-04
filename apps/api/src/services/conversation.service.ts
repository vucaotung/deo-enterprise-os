import type { Pool } from 'pg';
import type { AfterChatPayload } from '@deo/shared';
import type { Logger } from '../lib/logger.js';

export interface ConversationDeps {
  pool: Pool;
  logger: Logger;
}

// Insert conversation row. Fire-and-forget — callers don't await this.
export const logConversation = (
  { pool, logger }: ConversationDeps,
  payload: AfterChatPayload,
  correlationId: string | undefined
): void => {
  pool
    .query(
      `INSERT INTO deo.agent_conversations
         (agent_id, user_id, channel, tenant_id,
          user_message, agent_response,
          tokens_prompt, tokens_completion, tokens_total,
          latency_ms, correlation_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        payload.agentId,
        payload.userId,
        payload.channel,
        payload.tenantId ?? null,
        payload.userMessage,
        payload.agentResponse,
        payload.usage?.promptTokens ?? null,
        payload.usage?.completionTokens ?? null,
        payload.usage?.totalTokens ?? null,
        payload.latencyMs ?? null,
        correlationId ?? null,
        payload.timestamp,
      ]
    )
    .catch((e: unknown) => {
      logger.error(
        { err: e, agentId: payload.agentId, correlationId },
        'failed to log conversation'
      );
    });
};
