import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireMinRole } from '../middleware/require-role';
import { AuditedRequest } from '../middleware/audit';
import { v4 as uuidv4 } from 'uuid';
import { createExecutionAndEnqueue } from './agent-jobs';
import { pickAgentForTask } from '../services/agent-router.service';
import { emitNotification } from '../services/notify.service';

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

const workflowStatusExpr = `COALESCE(t.workflow_status,
  CASE
    WHEN t.status = 'completed' THEN 'completed'
    WHEN t.status = 'in_progress' THEN 'in_progress'
    WHEN t.status IN ('failed', 'cancelled') THEN 'cancelled'
    ELSE 'todo'
  END
)`;

const taskSelectExpr = `
  t.*,
  ${workflowStatusExpr} AS workflow_status_normalized,
  p.name AS project_name,
  COALESCE(u.name, u.email, a.display_name) AS assignee_name,
  a.display_name AS agent_display_name
`;

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset, page } = getPaginationParams(req.query);
    const { project_id, assigned_to } = req.query;
    const requestedStatus = normalizeIncomingStatus(req.query.status as string | undefined);
    const companyId = req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID || 'b1f6384d-4ac0-40f1-91b9-95b8cfeb0712';

    let queryStr = `SELECT ${taskSelectExpr} FROM deo.tasks t LEFT JOIN deo.projects p ON p.id = t.project_id LEFT JOIN deo.users u ON u.id = t.assigned_to LEFT JOIN deo.agents a ON a.id = COALESCE(t.agent_id, t.assigned_to) WHERE t.company_id = $1`;
    const params: any[] = [companyId];

    if (project_id) {
      queryStr += ` AND t.project_id = $${params.length + 1}`;
      params.push(project_id);
    }

    if (assigned_to) {
      queryStr += ` AND t.assigned_to = $${params.length + 1}`;
      params.push(assigned_to);
    }

    if (requestedStatus) {
      queryStr += ` AND ${workflowStatusExpr} = $${params.length + 1}`;
      params.push(requestedStatus);
    }

    queryStr += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

router.get('/preview-agent', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const rawTags = req.query.tags;
    const tags = parseTagsParam(rawTags);
    const picked = await pickAgentForTask({ tags });
    res.json({ picked, tags });
  } catch (error) {
    console.error('Preview agent error', error);
    res.status(500).json({ error: 'Failed to preview agent' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      title,
      description,
      project_id,
      priority,
      due_date,
      estimated_hours,
      assigned_to,
      tags,
      agent_id: explicitAgentId,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskId = uuidv4();
    const normalizedTags = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === 'string') : [];

    let agentId: string | null = explicitAgentId || null;
    let routedReason: string | null = null;
    if (!agentId) {
      const picked = await pickAgentForTask({ tags: normalizedTags });
      if (picked) {
        agentId = picked.agent_id;
        routedReason = picked.reason;
      }
    }

    await dbQuery(
      `INSERT INTO deo.tasks (id, company_id, project_id, title, description, status, workflow_status, priority, created_by, assigned_to, agent_id, tags, due_date, estimated_hours, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, NOW(), NOW())`,
      [
        taskId,
        req.user.company_id,
        project_id || null,
        title,
        description || null,
        'todo',
        'todo',
        priority || 'medium',
        req.user.id,
        assigned_to || null,
        agentId,
        JSON.stringify(normalizedTags),
        due_date || null,
        estimated_hours || null,
      ]
    );

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      new_values: { title, description, project_id, priority, workflow_status: 'todo', agent_id: agentId, routed_reason: routedReason },
    };

    if (assigned_to && assigned_to !== req.user.id) {
      await emitNotification(assigned_to, {
        type: 'assignment',
        title: 'Bạn được gán một task mới',
        body: title,
        link: `/tasks/${taskId}`,
        entity_type: 'task',
        entity_id: taskId,
      });
    }

    const result = await dbQuery(
      `SELECT ${taskSelectExpr} FROM deo.tasks t LEFT JOIN deo.projects p ON p.id = t.project_id LEFT JOIN deo.users u ON u.id = t.assigned_to LEFT JOIN deo.agents a ON a.id = COALESCE(t.agent_id, t.assigned_to) WHERE t.id = $1`,
      [taskId]
    );

    res.status(201).json({ ...result.rows[0], routed_reason: routedReason });
  } catch (error) {
    console.error('Create task error', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

function parseTagsParam(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    if (raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        // fallthrough
      }
    }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const companyId = req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID || 'b1f6384d-4ac0-40f1-91b9-95b8cfeb0712';
    const result = await dbQuery(
      `SELECT ${taskSelectExpr} FROM deo.tasks t LEFT JOIN deo.projects p ON p.id = t.project_id LEFT JOIN deo.users u ON u.id = t.assigned_to LEFT JOIN deo.agents a ON a.id = COALESCE(t.agent_id, t.assigned_to) WHERE t.id = $1 AND t.company_id = $2`,
      [req.params.id, companyId]
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
    const companyId = req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID || 'b1f6384d-4ac0-40f1-91b9-95b8cfeb0712';
    const oldResult = await dbQuery('SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2', [taskId, companyId]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldTask = oldResult.rows[0];
    const { title, description, status, priority, assigned_to, due_date, project_id } = req.body;

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
    values.push(taskId, companyId);

    const queryStr = `UPDATE deo.tasks SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;
    const result = await dbQuery(queryStr, values);
    const taskResult = await dbQuery(
      `SELECT ${taskSelectExpr} FROM deo.tasks t LEFT JOIN deo.projects p ON p.id = t.project_id LEFT JOIN deo.users u ON u.id = t.assigned_to LEFT JOIN deo.agents a ON a.id = COALESCE(t.agent_id, t.assigned_to) WHERE t.id = $1 AND t.company_id = $2`,
      [taskId, companyId]
    );

    req.auditData = {
      entity_type: 'task',
      entity_id: taskId,
      old_values: oldTask,
      new_values: result.rows[0],
    };

    if (assigned_to !== undefined && assigned_to && assigned_to !== oldTask.assigned_to && assigned_to !== req.user.id) {
      await emitNotification(assigned_to, {
        type: 'assignment',
        title: 'Bạn được gán vào task',
        body: result.rows[0]?.title || taskResult.rows[0]?.title || 'Task',
        link: `/tasks/${taskId}`,
        entity_type: 'task',
        entity_id: taskId,
      });
    }

    res.json(taskResult.rows[0]);
  } catch (error) {
    console.error('Update task error', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', authMiddleware, requireMinRole('manager'), async (req: AuditedRequest, res: Response) => {
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

    const { notes } = req.body;
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
      new_values: { notes, status: 'in_progress' },
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
      `UPDATE deo.tasks SET status = $1, workflow_status = $2, updated_at = NOW() WHERE id = $3 AND company_id = $4 RETURNING *`,
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

// ============================================================
// Task executions: per-attempt control plane
// ============================================================

router.get('/:id/executions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const taskId = req.params.id;

    const taskResult = await dbQuery(
      'SELECT id FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [taskId, req.user.company_id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = await dbQuery(
      `SELECT te.*,
              aj.id AS agent_job_id,
              aj.queue_state AS agent_job_queue_state,
              aj.runtime_type AS agent_job_runtime_type,
              aj.agent_id AS agent_job_agent_id,
              aj.tokens_in AS agent_job_tokens_in,
              aj.tokens_out AS agent_job_tokens_out,
              aj.cost_usd AS agent_job_cost_usd
         FROM deo.task_executions te
         LEFT JOIN LATERAL (
           SELECT * FROM deo.agent_jobs
            WHERE execution_id = te.id
            ORDER BY sequence_index ASC, created_at ASC LIMIT 1
         ) aj ON true
         WHERE te.task_id = $1
         ORDER BY te.attempt_number DESC`,
      [taskId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List executions error', error);
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

router.post('/:id/executions', authMiddleware, requireMinRole('manager'), async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const taskId = req.params.id;
    const { runtime_type, agent_id, input, trigger_reason } = req.body;

    const taskResult = await dbQuery(
      'SELECT id FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [taskId, req.user.company_id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const created = await createExecutionAndEnqueue({
      taskId,
      companyId: req.user.company_id,
      triggeredBy: req.user.id,
      triggerReason: trigger_reason || 'manual',
      runtimeType: runtime_type,
      agentId: agent_id,
      input,
    });

    req.auditData = {
      entity_type: 'task_execution',
      entity_id: created.execution.id,
      new_values: {
        task_id: taskId,
        agent_job_id: created.agentJob.id,
        attempt_number: created.execution.attempt_number,
        trigger_reason: created.execution.trigger_reason,
      },
    };

    res.status(201).json(created);
  } catch (error) {
    console.error('Create execution error', error);
    res.status(500).json({ error: 'Failed to create execution' });
  }
});

export default router;
