import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AuditedRequest } from '../middleware/audit';
import { v4 as uuidv4 } from 'uuid';

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

// ============================================================
// POST /api/projects — Create project
// ============================================================
router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, description, client_id, priority, start_date, due_date, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const projectId = uuidv4();
    const code = `PRJ-${Date.now().toString(36).toUpperCase()}`;

    await dbQuery(
      `INSERT INTO deo.projects (id, company_id, name, code, description, client_id, status, priority, start_date, end_date, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [projectId, req.user.company_id, name, code, description || null, client_id || null,
       status || 'planning', priority || 'medium', start_date || null, due_date || null, req.user.id]
    );

    req.auditData = {
      entity_type: 'project',
      entity_id: projectId,
      new_values: { name, description, priority, status: status || 'planning' },
    };

    // Log activity
    await dbQuery(
      `INSERT INTO deo.activity_logs (action, actor_type, actor_id, entity_type, entity_id, company_id, summary)
       VALUES ('project_created', 'human', $1, 'project', $2, $3, $4)`,
      [req.user.id, projectId, req.user.company_id, `Created project: ${name}`]
    );

    const result = await dbQuery(
      `SELECT p.*, c.name AS client_name
       FROM deo.projects p
       LEFT JOIN deo.clients c ON c.id = p.client_id
       WHERE p.id = $1`,
      [projectId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ============================================================
// PATCH /api/projects/:id — Update project
// ============================================================
router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const projectId = req.params.id;
    const { name, description, status, priority, client_id, start_date, due_date } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push(`name = $${values.length + 1}`); values.push(name); }
    if (description !== undefined) { updates.push(`description = $${values.length + 1}`); values.push(description); }
    if (status !== undefined) { updates.push(`status = $${values.length + 1}`); values.push(status); }
    if (priority !== undefined) { updates.push(`priority = $${values.length + 1}`); values.push(priority); }
    if (client_id !== undefined) { updates.push(`client_id = $${values.length + 1}`); values.push(client_id); }
    if (start_date !== undefined) { updates.push(`start_date = $${values.length + 1}`); values.push(start_date); }
    if (due_date !== undefined) { updates.push(`end_date = $${values.length + 1}`); values.push(due_date); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');
    values.push(projectId, req.user.company_id);

    const queryStr = `UPDATE deo.projects SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;
    const result = await dbQuery(queryStr, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    req.auditData = {
      entity_type: 'project',
      entity_id: projectId,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ============================================================
// DELETE /api/projects/:id — Archive project (soft delete)
// ============================================================
router.delete('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `UPDATE deo.projects SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    req.auditData = {
      entity_type: 'project',
      entity_id: req.params.id,
      old_values: result.rows[0],
    };

    res.status(204).send();
  } catch (error) {
    console.error('Delete project error', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ============================================================
// GET /api/projects/:id/members — List project members
// ============================================================
router.get('/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `SELECT pm.*, w.display_name, w.email, w.worker_type, w.avatar_url, w.status AS worker_status
       FROM deo.project_members pm
       JOIN deo.workers w ON w.id = pm.worker_id
       WHERE pm.project_id = $1 AND pm.left_at IS NULL
       ORDER BY pm.joined_at ASC`,
      [req.params.id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List project members error', error);
    res.status(500).json({ error: 'Failed to fetch project members' });
  }
});

// ============================================================
// POST /api/projects/:id/members — Add member
// ============================================================
router.post('/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { worker_id, membership_role } = req.body;

    if (!worker_id) {
      return res.status(400).json({ error: 'worker_id is required' });
    }

    const memberId = uuidv4();
    const role = membership_role || 'contributor';

    const result = await dbQuery(
      `INSERT INTO deo.project_members (id, project_id, worker_id, membership_role, joined_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [memberId, req.params.id, worker_id, role]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Member already exists in this project' });
    }

    // Log activity
    await dbQuery(
      `INSERT INTO deo.activity_logs (action, actor_type, actor_id, entity_type, entity_id, project_id, company_id, summary)
       VALUES ('member_added', 'human', $1, 'project', $2, $2, $3, $4)`,
      [req.user.id, req.params.id, req.user.company_id, `Added member to project`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add project member error', error);
    res.status(500).json({ error: 'Failed to add project member' });
  }
});

// ============================================================
// DELETE /api/projects/:id/members/:memberId — Remove member
// ============================================================
router.delete('/:id/members/:memberId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `UPDATE deo.project_members SET left_at = NOW()
       WHERE id = $1 AND project_id = $2 AND left_at IS NULL
       RETURNING *`,
      [req.params.memberId, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Remove project member error', error);
    res.status(500).json({ error: 'Failed to remove project member' });
  }
});

// ============================================================
// GET /api/projects/:id/tasks — Project tasks
// ============================================================
router.get('/:id/tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { status } = req.query;
    let where = 'WHERE t.project_id = $1 AND t.company_id = $2';
    const params: any[] = [req.params.id, req.user.company_id];

    if (status) {
      where += ` AND ${TASK_WORKFLOW_EXPR} = $${params.length + 1}`;
      params.push(status);
    }

    const result = await dbQuery(
      `SELECT t.*, ${TASK_WORKFLOW_EXPR} AS workflow_status_normalized
       FROM deo.tasks t
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List project tasks error', error);
    res.status(500).json({ error: 'Failed to fetch project tasks' });
  }
});

export default router;
