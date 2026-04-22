import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const getPaginationParams = (query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset } = getPaginationParams(req.query);
    const { entity_type, entity_id, user_id, action } = req.query;

    let queryStr = 'SELECT * FROM deo.audit_events WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (entity_type) {
      queryStr += ` AND entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }

    if (entity_id) {
      queryStr += ` AND entity_id = $${params.length + 1}`;
      params.push(entity_id);
    }

    if (user_id) {
      queryStr += ` AND user_id = $${params.length + 1}`;
      params.push(user_id);
    }

    if (action) {
      queryStr += ` AND action = $${params.length + 1}`;
      params.push(action);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List audit events error', error);
    res.status(500).json({ error: 'Failed to fetch audit events' });
  }
});

export default router;
