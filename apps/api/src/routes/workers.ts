// ============================================================
// Workers API — Human + AI unified view
// ============================================================
import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================================
// GET /api/workers — List all workers with task stats
// ============================================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { worker_type, status, search } = req.query;

    let where = 'WHERE w.company_id = $1';
    const params: any[] = [req.user.company_id];

    if (worker_type) {
      where += ` AND w.worker_type = $${params.length + 1}`;
      params.push(worker_type);
    }
    if (status) {
      where += ` AND w.status = $${params.length + 1}`;
      params.push(status);
    }
    if (search) {
      where += ` AND (w.display_name ILIKE $${params.length + 1} OR w.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    const result = await dbQuery(
      `SELECT
         w.*,
         COALESCE(ts.active_tasks, 0)::int AS active_tasks,
         COALESCE(ts.completed_tasks, 0)::int AS completed_tasks,
         COALESCE(
           (SELECT json_agg(r.key)
            FROM deo.worker_roles wr
            JOIN deo.roles r ON r.id = wr.role_id
            WHERE wr.worker_id = w.id),
           '[]'::json
         ) AS roles
       FROM deo.workers w
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) FILTER (WHERE t.status NOT IN ('completed','cancelled')) AS active_tasks,
           COUNT(*) FILTER (WHERE t.status = 'completed') AS completed_tasks
         FROM deo.tasks t
         WHERE t.assigned_to = w.user_id
       ) ts ON TRUE
       ${where}
       ORDER BY w.worker_type ASC, w.display_name ASC`,
      params
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List workers error:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// ============================================================
// GET /api/workers/:id — Worker detail
// ============================================================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const result = await dbQuery(
      `SELECT
         w.*,
         COALESCE(
           (SELECT json_agg(json_build_object('key', r.key, 'label', r.label, 'scope_type', wr.scope_type))
            FROM deo.worker_roles wr
            JOIN deo.roles r ON r.id = wr.role_id
            WHERE wr.worker_id = w.id),
           '[]'::json
         ) AS roles,
         COALESCE(
           (SELECT json_agg(json_build_object(
             'project_id', pm.project_id,
             'project_name', p.name,
             'project_code', p.code,
             'membership_role', pm.membership_role
           ))
            FROM deo.project_members pm
            JOIN deo.projects p ON p.id = pm.project_id
            WHERE pm.worker_id = w.id AND pm.left_at IS NULL),
           '[]'::json
         ) AS projects
       FROM deo.workers w
       WHERE w.id = $1 AND w.company_id = $2`,
      [id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// ============================================================
// GET /api/workers/:id/tasks — Worker's tasks
// ============================================================
router.get('/:id/tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { status } = req.query;

    const worker = await dbQuery(
      'SELECT user_id FROM deo.workers WHERE id = $1 AND company_id = $2',
      [id, req.user.company_id]
    );
    if (worker.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const userId = worker.rows[0].user_id;
    if (!userId) {
      return res.json({ data: [] }); // AI worker has no tasks via assigned_to
    }

    let where = 'WHERE t.assigned_to = $1 AND t.company_id = $2';
    const params: any[] = [userId, req.user.company_id];

    if (status) {
      where += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    const result = await dbQuery(
      `SELECT t.*, p.name AS project_name, p.code AS project_code
       FROM deo.tasks t
       LEFT JOIN deo.projects p ON p.id = t.project_id
       ${where}
       ORDER BY t.due_date ASC NULLS LAST`,
      params
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Worker tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch worker tasks' });
  }
});

export default router;
