// ADR-08: correlation ID middleware. Reads X-Correlation-ID header,
// generates one if missing, and exposes it on res + res.locals for logger + audit.

import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const HEADER = 'x-correlation-id';

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const incoming = req.header(HEADER);
  const correlationId = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.locals.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      correlationId?: string;
    }
  }
}
