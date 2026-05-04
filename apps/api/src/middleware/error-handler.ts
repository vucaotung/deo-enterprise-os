// ADR-05: error handler converts thrown errors into the structured response envelope.

import type { ErrorCode } from '@deo/shared';
import { err } from '@deo/shared';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { Logger } from '../lib/logger.js';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const buildErrorHandler =
  (logger: Logger) =>
  (e: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const correlationId = res.locals.correlationId;
    const meta = correlationId ? { correlationId } : undefined;

    if (e instanceof HttpError) {
      logger.warn(
        { correlationId, code: e.code, status: e.status, path: req.path },
        e.message
      );
      res.status(e.status).json(err(e.code, e.message, e.details, meta));
      return;
    }

    if (e instanceof ZodError) {
      logger.warn(
        { correlationId, path: req.path, issues: e.issues },
        'validation failed'
      );
      res.status(400).json(
        err('VALIDATION_FAILED', 'Request validation failed', { issues: e.issues }, meta)
      );
      return;
    }

    logger.error({ correlationId, err: e, path: req.path }, 'unhandled error');
    res.status(500).json(err('INTERNAL', 'Internal server error', undefined, meta));
  };
