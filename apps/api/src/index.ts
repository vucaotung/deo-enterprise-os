import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createDbPool } from './db.js';
import { createLogger } from './lib/logger.js';
import { createRedis } from './redis.js';

const main = async (): Promise<void> => {
  const env = loadEnv();
  const logger = createLogger(env);
  const pool = createDbPool(env);
  const redis = createRedis(env);
  const startedAt = new Date();

  await redis.connect();

  const app = buildApp({ logger, pool, redis, startedAt, hookSecret: env.HOOK_SECRET });

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'deo-api listening');
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown initiated');
    server.close(() => {
      logger.info('http server closed');
    });
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.error('fatal startup error:', e);
  process.exit(1);
});
