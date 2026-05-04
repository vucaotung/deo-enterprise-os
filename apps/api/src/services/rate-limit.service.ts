// Hook 3: Rate limit per (user, agent, hour-bucket).
// Spec: HOOKS_PLAN.md Phase 4 — Redis counter, role-based limits.

import type { Redis } from 'ioredis';

export type UserRole = 'staff' | 'management' | 'system' | 'unknown';

export interface RateLimitDeps {
  redis: Redis;
}

export interface RateLimitInput {
  userId: string;
  agentId: string;
  role: UserRole;
}

export interface RateLimitDecision {
  blocked: boolean;
  count: number;
  limit: number;
}

const LIMITS: Record<UserRole, number> = {
  staff: 20,
  management: 100,
  system: Number.MAX_SAFE_INTEGER,
  unknown: 50,
};

const hourBucket = (d = new Date()): string =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}`;

export const checkRate = async (
  { redis }: RateLimitDeps,
  { userId, agentId, role }: RateLimitInput
): Promise<RateLimitDecision> => {
  const limit = LIMITS[role];
  if (limit === Number.MAX_SAFE_INTEGER) {
    return { blocked: false, count: 0, limit };
  }
  const key = `rate:${userId}:${agentId}:${hourBucket()}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  return { blocked: count > limit, count, limit };
};
