import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export function correlationIdMiddleware(req: CorrelatedRequest, res: Response, next: NextFunction) {
  const correlationId = (req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string) || uuidv4();
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
