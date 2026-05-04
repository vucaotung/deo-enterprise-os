// ADR-08: /health and /ready endpoints.
// /health = process alive (200 always when reachable)
// /ready = dependencies usable (DB + Redis); 503 if any down

import { ok } from '@deo/shared';
import { Router } from 'express';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import { pingDb } from '../db.js';
import { pingRedis } from '../redis.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  startedAt: Date;
}

export const buildHealthRouter = ({ pool, redis, startedAt }: Deps): Router => {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json(
      ok({
        status: 'ok',
        uptimeSec: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      })
    );
  });

  router.get('/ready', async (_req, res) => {
    const [db, cache] = await Promise.all([pingDb(pool), pingRedis(redis)]);
    const allOk = db && cache;
    res
      .status(allOk ? 200 : 503)
      .json(ok({ status: allOk ? 'ready' : 'degraded', checks: { db, redis: cache } }));
  });

  return router;
};
