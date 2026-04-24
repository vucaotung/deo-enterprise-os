// ============================================================
// Activity API — Feed & timeline
// ============================================================
import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================================
// GET /api/activity — Paginated feed with filters
// ============================================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      project_id, entity_type, action, actor_id,
      page = '1', limit = '30',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const offset = (pageNum - 1) * limitNum;

    let where = 'WHERE al.company_id = $1';
    const params: any[] = [req.user.company_id];

    if (project_id) {
      where += ` AND al.project_id = $${params.length + 1}`;
      params.push(project_id);
    }
    if (entity_type) {
      where += ` AND al.entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }
    if (action) {
      where += ` AND al.action = $${params.length + 1}`;
      params.push(action);
    }
    if (actor_id) {
      where += ` AND al.actor_id = $${params.length + 1}`;
      params.push(actor_id);
    }

    // Count
    const countResult = await dbQuery(
      `SELECT COUNT(*)::int AS total FROM deo.activity_logs al ${where}`,
      params
    );

    // Data
    const dataParams = [...params, limitNum, offset];
    const result = await dbQuery(
      `SELECT al.*,
         w.display_name AS actor_name,
         w.avatar_url AS actor_avatar
       FROM deo.activity_logs al
       LEFT JOIN deo.workers w ON w.id::text = al.actor_id::text
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    );

    res.json({
      data: result.rows,
      pagination: {
        total: countResult.rows[0].total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(countResult.rows[0].total / limitNum),
      },
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
