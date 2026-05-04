// Hook 4: Error alerter.
// Spec: HOOKS_PLAN.md Hook 4 — log + push Telegram for critical agents.
// TODO(sprint-c-2): wire Telegram push (cần config bot token + chat_id).

import type { Redis } from 'ioredis';
import type { OnErrorPayload } from '@deo/shared';
import type { Logger } from '../lib/logger.js';

const CRITICAL_AGENTS = new Set(['deo', 'ops-admin', 'finance-agent', 'hr-agent']);
const ERROR_THRESHOLD = 3;
const ERROR_WINDOW_SEC = 300;

export interface ErrorAlertDeps {
  redis: Redis;
  logger: Logger;
}

export interface ErrorAlertResult {
  isCritical: boolean;
  errorCountInWindow: number;
  shouldEscalate: boolean;
}

export const recordAgentError = async (
  { redis, logger }: ErrorAlertDeps,
  payload: OnErrorPayload,
  correlationId: string | undefined
): Promise<ErrorAlertResult> => {
  const isCritical = CRITICAL_AGENTS.has(payload.agentId);
  const key = `agent:err:${payload.agentId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, ERROR_WINDOW_SEC);

  logger.error(
    {
      correlationId,
      agentId: payload.agentId,
      userId: payload.userId,
      errorMessage: payload.errorMessage,
      errorCode: payload.errorCode,
      isCritical,
      countInWindow: count,
    },
    'agent error reported via on_error hook'
  );

  return {
    isCritical,
    errorCountInWindow: count,
    shouldEscalate: isCritical || count > ERROR_THRESHOLD,
  };
};
