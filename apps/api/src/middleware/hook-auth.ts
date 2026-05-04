// Verify X-Hook-Secret header on hook endpoints.
// Spec: HOOKS_PLAN.md §1.1 "GoClaw gọi với X-Hook-Secret header (shared secret trong .env)"

import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { HttpError } from './error-handler.js';

const HEADER = 'x-hook-secret';

const constantTimeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
};

export const buildHookAuthMiddleware =
  (expectedSecret: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const provided = req.header(HEADER);
    if (!provided || !constantTimeEqual(provided, expectedSecret)) {
      next(new HttpError(401, 'UNAUTHENTICATED', 'invalid or missing X-Hook-Secret'));
      return;
    }
    next();
  };
