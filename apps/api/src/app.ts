// Express app factory. Separated from index.ts so tests can build an app
// without binding to a port.

import express from 'express';
import { pinoHttp } from 'pino-http';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { buildErrorHandler } from './middleware/error-handler.js';
import { buildHealthRouter } from './routes/health.js';
import { buildHooksRouter } from './routes/hooks.js';
import type { Logger } from './lib/logger.js';

export interface AppDeps {
  logger: Logger;
  pool: Pool;
  redis: Redis;
  startedAt: Date;
  hookSecret: string;
}

export const buildApp = (deps: AppDeps): express.Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(correlationIdMiddleware);
  app.use(
    pinoHttp({
      logger: deps.logger,
      customProps: (_req, res) => ({ correlationId: res.locals.correlationId }),
    })
  );

  app.use(buildHealthRouter({ pool: deps.pool, redis: deps.redis, startedAt: deps.startedAt }));
  app.use(
    buildHooksRouter({
      pool: deps.pool,
      redis: deps.redis,
      logger: deps.logger,
      hookSecret: deps.hookSecret,
    })
  );

  app.use(buildErrorHandler(deps.logger));

  return app;
};
