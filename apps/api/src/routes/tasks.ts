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

const normalizeIncomingStatus = (status?: string) => {
  switch (status) {
    case 'todo':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return status;
    case 'open':
    case 'assigned':
    case 'review':
      return 'todo';
    case 'failed':
      return 'cancelled';
    default:
      return undefined;
  }
};

const workflowStatusExpr = `COALESCE(workflow_status,
  CASE
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'in_progress' THEN 'in_progress'
    WHEN status IN ('failed', 'cancelled') THEN 'cancelled'
    ELSE 'todo'
  END
)`;

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset, page } = getPaginationParams(req.query);
    const { project_id, assigned_to } = req.query;
    const requestedStatus = normalizeIncomingStatus(req.query.status as string | undefined);

    let queryStr = `SELECT *, ${workflowStatusExpr} AS workflow_status_normalized FROM deo.tasks WHERE company_id = $1`;
    const params: any[] = [req.user.company_id];

    if (project_id) {
      queryStr += ` AND project_id = $${params.length + 1}`;
      params.push(project_id);
    }

    if (assigned_to) {
      queryStr += ` AND assigned_to = $${params.length + 1}`;
      params.push(assigned_to);
    }

    if (requestedStatus) {
      queryStr += ` AND ${workflowStatusExpr} = $${params.length + 1}`;
      params.push(requestedStatus);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List tasks error', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, project_id, priority, due_date, estimated_hours, assigned_to } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.tasks (id, company_id, project_id, title, description, status, workflow_status, priority, created_by, assigned_to, due_date, estimated_hours, progress_percentage, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, NOW(), NOW())`,
      [taskId, req.user.company_id, project_id || null, title, description || null, 'todo', 'todo', priority || 'medium', req.user.id, assigned_to || null, due_date || null, estimated_hours || null]
    );

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      new_values: { title, description, project_id, priority, workflow_status: 'todo' },
    };

    const result = await dbQuery(`SELECT *, ${workflowStatusExpr} AS workflow_status_normalized FROM deo.tasks WHERE id = $1`, [taskId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `SELECT *, ${workflowStatusExpr} AS workflow_status_normalized FROM deo.tasks WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get task error', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const taskId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2', [taskId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldTask = oldResult.rows[0];
    const { title, description, status, priority, assigned_to, due_date, progress_percentage, project_id } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${values.length + 1}`);
      values.push(priority);
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${values.length + 1}`);
      values.push(assigned_to);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${values.length + 1}`);
      values.push(due_date);
    }
    if (project_id !== undefined) {
      updates.push(`project_id = $${values.length + 1}`);
      values.push(project_id);
    }
    if (progress_percentage !== undefined) {
      updates.push(`progress_percentage = $${values.length + 1}`);
      values.push(progress_percentage);
    }

    const normalizedStatus = normalizeIncomingStatus(status);
    if (normalizedStatus !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(normalizedStatus);
      updates.push(`workflow_status = $${values.length + 1}`);
      values.push(normalizedStatus);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(taskId, req.user.company_id);

    const queryStr = `UPDATE deo.tasks SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;
    const result = await dbQuery(queryStr, values);

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      old_values: oldTask,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task error', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const taskId = req.params.id;

    const result = await dbQuery(
      'DELETE FROM deo.tasks WHERE id = $1 AND company_id = $2 RETURNING *',
      [taskId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      old_values: result.rows[0],
    };

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.post('/:id/pick', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const taskId = req.params.id;

    const result = await dbQuery(
      `UPDATE deo.tasks SET status = $1, workflow_status = $2, assigned_to = $3, updated_at = NOW() WHERE id = $4 AND company_id = $5 RETURNING *`,
      ['todo', 'todo', req.user.id, taskId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      new_values: { status: 'todo', assigned_to: req.user.id },
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Pick task error', error);
    res.status(500).json({ error: 'Failed to pick task' });
  }
});

router.post('/:id/progress', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { progress_percentage, notes } = req.body;
    const taskId = req.params.id;

    if (progress_percentage === undefined) {
      return res.status(400).json({ error: 'Progress percentage is required' });
    }

    const result = await dbQuery(
      `UPDATE deo.tasks SET status = $1, workflow_status = $2, progress_percentage = $3, updated_at = NOW() WHERE id = $4 AND company_id = $5 RETURNING *`,
      ['in_progress', 'in_progress', progress_percentage, taskId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      new_values: { progress_percentage, notes, status: 'in_progress' },
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Task progress error', error);
    res.status(500).json({ error: 'Failed to update task progress' });
  }
});

router.post('/:id/complete', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const taskId = req.params.id;

    const result = await dbQuery(
      `UPDATE deo.tasks SET status = $1, workflow_status = $2, progress_percentage = 100, updated_at = NOW() WHERE id = $3 AND company_id = $4 RETURNING *`,
      ['completed', 'completed', taskId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      new_values: { status: 'completed' },
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Complete task error', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

router.post('/:id/fail', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { reason } = req.body;
    const taskId = req.params.id;

    const result = await dbQuery(
      `UPDATE deo.tasks SET status = $1, workflow_status = $2, updated_at = NOW() WHERE id = $3 AND company_id = $4 RETURNING *`,
      ['cancelled', 'cancelled', taskId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      new_values: { status: 'cancelled', reason },
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fail task error', error);
    res.status(500).json({ error: 'Failed to fail task' });
  }
});

router.post('/:id/request-review', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const taskId = req.params.id;

    const result = await dbQuery(
      `UPDATE deo.tasks SET status = $1, workflow_status = $2, updated_at = NOW() WHERE id = $3 AND company_id = $4 RETURNING *`,
      ['in_progress', 'in_progress', taskId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      new_values: { status: 'in_progress', review_required: true },
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Request review error', error);
    res.status(500).json({ error: 'Failed to request review' });
  }
});

export default router;
