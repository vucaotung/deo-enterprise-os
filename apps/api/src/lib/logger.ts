import { pino } from 'pino';
import type { Env } from '../config/env.js';

export const createLogger = (env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>) =>
  pino({
    level: env.LOG_LEVEL,
    base: { service: 'deo-api', env: env.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-service-token"]',
        'req.headers["x-hook-secret"]',
        '*.password',
      ],
      censor: '[REDACTED]',
    },
  });

export type Logger = ReturnType<typeof createLogger>;
