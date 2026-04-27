import { Request, Response, NextFunction } from 'express';
import { query as dbQuery } from '../db';

export interface AgentRequest extends Request {
  agent?: {
    id: string;
    slug?: string;
    name: string;
    company_id?: string;
  };
}

/**
 * Authorize a request as coming from an agent. Expects:
 *   X-Agent-Token: <uuid>          (matched against deo.agents.api_token)
 *   X-Agent-Id:    <uuid|slug>     (optional, used to validate slug match)
 *
 * Sets req.agent on success.
 */
export async function agentAuthMiddleware(
  req: AgentRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.header('X-Agent-Token');
  if (!token) {
    return res.status(401).json({ error: 'Missing X-Agent-Token' });
  }

  try {
    const result = await dbQuery(
      `SELECT id, slug, name, company_id FROM deo.agents WHERE api_token = $1`,
      [token]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid agent token' });
    }
    req.agent = result.rows[0];
    next();
  } catch (err) {
    console.error('agentAuth error', err);
    res.status(500).json({ error: 'Agent auth failed' });
  }
}
