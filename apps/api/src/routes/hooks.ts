// GoClaw lifecycle hooks endpoints.
// Spec: goclaw/config/HOOKS_PLAN.md
//
// Hook 1 (User Context Injection) — before_chat
// Hook 2 (Conversation Logger)    — after_chat
// Hook 3 (Rate Limiter)           — before_chat
// Hook 4 (Error Alerter)          — on_error
// Hook 5 (Off-hours Blocker)      — before_chat (restricted agents only)

import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type {
  AfterChatPayload,
  BeforeChatPayload,
  BeforeChatResponse,
  HookAck,
  OnErrorPayload,
} from '@deo/shared';
import { ok } from '@deo/shared';
import type { Logger } from '../lib/logger.js';
import { buildHookAuthMiddleware } from '../middleware/hook-auth.js';
import { logConversation } from '../services/conversation.service.js';
import { recordAgentError } from '../services/error-alert.service.js';
import { isAgentRestricted, isOffHours } from '../services/off-hours.service.js';
import { checkRate } from '../services/rate-limit.service.js';
import { buildContextInject, lookupUserByChannel } from '../services/user-context.service.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  logger: Logger;
  hookSecret: string;
}

const BeforeChatSchema = z.object({
  hookType: z.literal('before_chat'),
  agentId: z.string().min(1),
  userId: z.string().min(1),
  channel: z.string().min(1),
  message: z.string(),
  tenantId: z.string().optional(),
  timestamp: z.string(),
});

const AfterChatSchema = z.object({
  hookType: z.literal('after_chat'),
  agentId: z.string().min(1),
  userId: z.string().min(1),
  channel: z.string().min(1),
  userMessage: z.string(),
  agentResponse: z.string(),
  usage: z
    .object({
      promptTokens: z.number().int().nonnegative().optional(),
      completionTokens: z.number().int().nonnegative().optional(),
      totalTokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  tenantId: z.string().optional(),
  timestamp: z.string(),
});

const OnErrorSchema = z.object({
  hookType: z.literal('on_error'),
  agentId: z.string().min(1),
  userId: z.string().min(1),
  channel: z.string().min(1),
  errorMessage: z.string(),
  errorStack: z.string().optional(),
  errorCode: z.string().optional(),
  userMessage: z.string().optional(),
  tenantId: z.string().optional(),
  timestamp: z.string(),
});

export const buildHooksRouter = ({ pool, redis, logger, hookSecret }: Deps): Router => {
  const router = Router();
  router.use(buildHookAuthMiddleware(hookSecret));

  router.post('/hooks/before-chat', async (req, res, next) => {
    try {
      const payload: BeforeChatPayload = BeforeChatSchema.parse(req.body);

      // Hook 5: off-hours block for restricted agents
      if (isAgentRestricted(payload.agentId) && isOffHours()) {
        const response: BeforeChatResponse = {
          block: true,
          message:
            '⏰ Ngoài giờ làm việc. Liên hệ Dẹo cho yêu cầu khẩn — agent này chỉ phục vụ 7:00–20:00 các ngày trong tuần.',
        };
        res.json(ok(response));
        return;
      }

      // Hook 1: user lookup → inject context
      const user = await lookupUserByChannel({ pool }, payload.channel, payload.userId);
      const inject = user ? buildContextInject(user) : undefined;

      // Hook 3: rate limit (uses role from user lookup, falls back to 'unknown')
      const decision = await checkRate(
        { redis },
        {
          userId: payload.userId,
          agentId: payload.agentId,
          role: user?.role ?? 'unknown',
        }
      );
      if (decision.blocked) {
        const response: BeforeChatResponse = {
          block: true,
          message: `⚠️ Bạn đã gửi ${decision.count} messages trong giờ này (giới hạn ${decision.limit}). Vui lòng thử lại sau.`,
        };
        res.json(ok(response));
        return;
      }

      const response: BeforeChatResponse = {
        block: false,
        ...(inject ? { inject } : {}),
      };
      res.json(ok(response));
    } catch (e) {
      next(e);
    }
  });

  router.post('/hooks/after-chat', (req, res, next) => {
    try {
      const payload: AfterChatPayload = AfterChatSchema.parse(req.body);
      const correlationId = res.locals.correlationId;
      // Fire-and-forget: spec §3.3 — must not block agent response.
      logConversation({ pool, logger }, payload, correlationId);
      const ack: HookAck = { ok: true };
      res.json(ok(ack));
    } catch (e) {
      next(e);
    }
  });

  router.post('/hooks/on-error', async (req, res, next) => {
    try {
      const payload: OnErrorPayload = OnErrorSchema.parse(req.body);
      const correlationId = res.locals.correlationId;
      await recordAgentError({ redis, logger }, payload, correlationId);
      const ack: HookAck = { ok: true };
      res.json(ok(ack));
    } catch (e) {
      next(e);
    }
  });

  return router;
};
