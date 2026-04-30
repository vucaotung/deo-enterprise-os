import { Request, Response, NextFunction } from 'express';

const SERVICE_TOKEN = process.env.GOCLAW_SERVICE_TOKEN || '';
const MCP_API_KEY = process.env.MCP_API_KEY || '';

export interface ServiceRequest extends Request {
  serviceId?: string;
  isServiceCall?: boolean;
}

/**
 * Auth middleware cho GoClaw và các internal service.
 * Chấp nhận:
 *   - X-Service-Token: <GOCLAW_SERVICE_TOKEN>  (GoClaw → EOS)
 *   - Authorization: Bearer <MCP_API_KEY>       (MCP clients)
 */
export function serviceAuthMiddleware(req: ServiceRequest, res: Response, next: NextFunction) {
  const serviceToken = req.headers['x-service-token'] as string;
  const bearerToken = extractBearer(req.headers.authorization);

  if (serviceToken && SERVICE_TOKEN && serviceToken === SERVICE_TOKEN) {
    req.serviceId = 'goclaw';
    req.isServiceCall = true;
    return next();
  }

  if (bearerToken && MCP_API_KEY && bearerToken === MCP_API_KEY) {
    req.serviceId = 'mcp-client';
    req.isServiceCall = true;
    return next();
  }

  return res.status(401).json({ error: 'Invalid or missing service credentials' });
}

function extractBearer(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}
