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

const TASK_WORKFLOW_EXPR = `COALESCE(t.workflow_status,
  CASE
    WHEN t.status = 'completed' THEN 'completed'
    WHEN t.status = 'in_progress' THEN 'in_progress'
    WHEN t.status IN ('failed', 'cancelled') THEN 'cancelled'
    ELSE 'todo'
  END
)`;

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset, page } = getPaginationParams(req.query);
    const { status, client_id, search } = req.query;

    let whereClause = 'WHERE p.company_id = $1';
    const params: any[] = [req.user.company_id];

    if (status) {
      whereClause += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }

    if (client_id) {
      whereClause += ` AND p.client_id = $${params.length + 1}`;
      params.push(client_id);
    }

    if (search) {
      whereClause += ` AND (p.name ILIKE $${params.length + 1} OR COALESCE(p.description, '') ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    const queryStr = `
      SELECT
        p.*,
        c.name AS client_name,
        COALESCE(task_stats.total_tasks, 0) AS total_tasks,
        COALESCE(task_stats.todo_tasks, 0) AS todo_tasks,
        COALESCE(task_stats.in_progress_tasks, 0) AS in_progress_tasks,
        COALESCE(task_stats.completed_tasks, 0) AS completed_tasks,
        COALESCE(task_stats.cancelled_tasks, 0) AS cancelled_tasks,
        COALESCE(task_stats.progress_percent, 0) AS progress_percent,
        COALESCE(clar_stats.open_clarifications, 0) AS open_clarifications
      FROM deo.projects p
      LEFT JOIN deo.clients c ON c.id = p.client_id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_tasks,
          COALESCE(ROUND(AVG(COALESCE(t.progress_percentage, CASE WHEN ${TASK_WORKFLOW_EXPR} = 'completed' THEN 100 ELSE 0 END))), 0) AS progress_percent
        FROM deo.tasks t
        WHERE t.project_id = p.id
      ) task_stats ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS open_clarifications
        FROM deo.clarifications cl
        WHERE cl.task_id IN (SELECT id FROM deo.tasks WHERE project_id = p.id)
          AND cl.status IN ('open', 'pending')
      ) clar_stats ON true
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List projects error', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `
      SELECT
        p.*,
        c.name AS client_name,
        COALESCE(task_stats.total_tasks, 0) AS total_tasks,
        COALESCE(task_stats.todo_tasks, 0) AS todo_tasks,
        COALESCE(task_stats.in_progress_tasks, 0) AS in_progress_tasks,
        COALESCE(task_stats.completed_tasks, 0) AS completed_tasks,
        COALESCE(task_stats.cancelled_tasks, 0) AS cancelled_tasks,
        COALESCE(task_stats.progress_percent, 0) AS progress_percent,
        COALESCE(clar_stats.open_clarifications, 0) AS open_clarifications
      FROM deo.projects p
      LEFT JOIN deo.clients c ON c.id = p.client_id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS total_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
          SUM(CASE WHEN ${TASK_WORKFLOW_EXPR} = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_tasks,
          COALESCE(ROUND(AVG(COALESCE(t.progress_percentage, CASE WHEN ${TASK_WORKFLOW_EXPR} = 'completed' THEN 100 ELSE 0 END))), 0) AS progress_percent
        FROM deo.tasks t
        WHERE t.project_id = p.id
      ) task_stats ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS open_clarifications
        FROM deo.clarifications cl
        WHERE cl.task_id IN (SELECT id FROM deo.tasks WHERE project_id = p.id)
          AND cl.status IN ('open', 'pending')
      ) clar_stats ON true
      WHERE p.id = $1 AND p.company_id = $2
      `,
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

export default router;
