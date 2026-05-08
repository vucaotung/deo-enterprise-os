import { Request, Response, NextFunction } from 'express';

export interface ServiceRequest extends Request {
  service?: {
    tokenPrefix?: string;
  };
}

export function extractServiceToken(req: Request) {
  const serviceToken = req.headers['x-service-token'];
  if (typeof serviceToken === 'string' && serviceToken.length > 0) {
    return serviceToken;
  }

  const header = req.headers.authorization;
  if (!header) return undefined;
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : header;
}

export function serviceTokenMiddleware(req: ServiceRequest, res: Response, next: NextFunction) {
  const expectedToken = process.env.ENTERPRISE_OS_MCP_TOKEN || process.env.AGENT_RUNNER_TOKEN;
  if (!expectedToken) {
    return res.status(503).json({ error: 'Service token is not configured' });
  }

  const token = extractServiceToken(req);
  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: 'Invalid service token' });
  }

  req.service = { tokenPrefix: token.slice(0, 8) };
  next();
}
