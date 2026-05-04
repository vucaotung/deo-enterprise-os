import { Redis } from 'ioredis';
import type { Env } from './config/env.js';

export const createRedis = (env: Pick<Env, 'REDIS_URL'>): Redis =>
  new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

export const pingRedis = async (redis: Redis): Promise<boolean> => {
  try {
    const reply = await redis.ping();
    return reply === 'PONG';
  } catch {
    return false;
  }
};
