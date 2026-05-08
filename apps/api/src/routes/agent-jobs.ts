import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AuditedRequest } from '../middleware/audit';
import { v4 as uuidv4 } from 'uuid';
import * as redis from '../redis';

const LOG_TAIL_MAX = 16384;
const DEFAULT_RUNTIME = 'openclaw';

const getPaginationParams = (query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const appendLogTail = (current: string | null, addition: string): string => {
  const next = (current || '') + addition;
  if (next.length <= LOG_TAIL_MAX) return next;
  return next.slice(next.length - LOG_TAIL_MAX);
};

const findAgentForRuntime = async (runtimeType: string) => {
  const result = await dbQuery(
    `SELECT id, runtime_type FROM deo.agents
       WHERE runtime_type = $1 AND status = 'online'
       ORDER BY last_heartbeat DESC NULLS LAST
       LIMIT 1`,
    [runtimeType]
  );
  return result.rows[0] || null;
};

const enqueueAgentJob = async (companyId: string, agentJobId: string) => {
  await redis.lpush(`jobs:queue:${companyId}`, agentJobId);
};

const fetchAgentJobScoped = async (agentJobId: string, companyId: string) => {
  const r = await dbQuery(
    `SELECT aj.*, te.task_id, te.attempt_number AS execution_attempt, te.status AS execution_status,
            t.company_id, t.title AS task_title
       FROM deo.agent_jobs aj
       JOIN deo.task_executions te ON te.id = aj.execution_id
       JOIN deo.tasks t ON t.id = te.task_id
       WHERE aj.id = $1 AND t.company_id = $2`,
    [agentJobId, companyId]
  );
  return r.rows[0] || null;
};

// Cascade execution status from its child agent_jobs.
// Single-job executions: simple pass-through. Multi-job: 'failed' if any
// job dead/cancelled, 'succeeded' only if every job is 'done'.
const cascadeExecutionStatus = async (executionId: string) => {
  const r = await dbQuery(
    `SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE queue_state = 'done')::INT AS done_count,
        COUNT(*) FILTER (WHERE queue_state IN ('dead','cancelled'))::INT AS terminal_bad,
        BOOL_OR(queue_state IN ('queued','claimed','running')) AS has_active
       FROM deo.agent_jobs WHERE execution_id = $1`,
    [executionId]
  );
  const row = r.rows[0];
  if (!row || row.has_active) return;

  let newStatus: string | null = null;
  if (row.terminal_bad > 0) newStatus = 'failed';
  else if (row.done_count > 0 && row.done_count === row.total) newStatus = 'succeeded';
  if (!newStatus) return;

  await dbQuery(
    `UPDATE deo.task_executions
       SET status = $1,
           finished_at = COALESCE(finished_at, NOW()),
           updated_at = NOW()
     WHERE id = $2
       AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
    [newStatus, executionId]
  );
};

interface CreateExecutionInput {
  taskId: string;
  companyId: string;
  triggeredBy?: string;
  triggerReason: string;
  runtimeType?: string;
  agentId?: string | null;
  input?: Record<string, unknown>;
  parentExecutionId?: string | null;
}

interface CreateExecutionResult {
  execution: any;
  agentJob: any;
}

// Atomically creates a task_execution and a single seed agent_job, then
// enqueues the agent_job into Redis. Used by both the new POST
// /api/tasks/:id/executions endpoint and the legacy POST /api/jobs creator.
const createExecutionAndEnqueue = async (input: CreateExecutionInput): Promise<CreateExecutionResult> => {
  const runtimeType = input.runtimeType || DEFAULT_RUNTIME;

  let agentId = input.agentId || null;
  if (!agentId) {
    const found = await findAgentForRuntime(runtimeType);
    agentId = found?.id || null;
  }

  const attemptResult = await dbQuery(
    `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next
       FROM deo.task_executions WHERE task_id = $1`,
    [input.taskId]
  );
  const attemptNumber = attemptResult.rows[0].next;

  const executionId = uuidv4();
  await dbQuery(
    `INSERT INTO deo.task_executions
       (id, task_id, parent_execution_id, attempt_number, status, triggered_by, trigger_reason, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW(), NOW())`,
    [
      executionId,
      input.taskId,
      input.parentExecutionId || null,
      attemptNumber,
      input.triggeredBy || null,
      input.triggerReason,
    ]
  );

  const agentJobId = uuidv4();
  const queueName = `jobs:queue:${input.companyId}`;
  await dbQuery(
    `INSERT INTO deo.agent_jobs
       (id, execution_id, sequence_index, agent_id, runtime_type, queue_name, queue_state, input, created_at, updated_at)
     VALUES ($1, $2, 0, $3, $4, $5, 'queued', $6, NOW(), NOW())`,
    [
      agentJobId,
      executionId,
      agentId,
      runtimeType,
      queueName,
      JSON.stringify(input.input || {}),
    ]
  );

  await dbQuery(
    `UPDATE deo.tasks
       SET execution_status = 'running', updated_at = NOW()
     WHERE id = $1`,
    [input.taskId]
  );

  await enqueueAgentJob(input.companyId, agentJobId);

  const executionResult = await dbQuery(
    `SELECT * FROM deo.task_executions WHERE id = $1`,
    [executionId]
  );
  const agentJobResult = await dbQuery(
    `SELECT * FROM deo.agent_jobs WHERE id = $1`,
    [agentJobId]
  );

  return {
    execution: executionResult.rows[0],
    agentJob: agentJobResult.rows[0],
  };
};

// ============================================================
// agentJobsRouter — /api/agent-jobs/*
// ============================================================
export const agentJobsRouter = Router();

agentJobsRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const job = await fetchAgentJobScoped(req.params.id, req.user.company_id);
    if (!job) return res.status(404).json({ error: 'Agent job not found' });
    res.json(job);
  } catch (error) {
    console.error('Get agent job error', error);
    res.status(500).json({ error: 'Failed to fetch agent job' });
  }
});

agentJobsRouter.patch('/:id/status', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const job = await fetchAgentJobScoped(req.params.id, req.user.company_id);
    if (!job) return res.status(404).json({ error: 'Agent job not found' });

    const { queue_state, output, error: jobError, started_at, finished_at, tokens_in, tokens_out, cost_usd } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (queue_state !== undefined) {
      updates.push(`queue_state = $${values.length + 1}`);
      values.push(queue_state);
    }
    if (output !== undefined) {
      updates.push(`output = $${values.length + 1}`);
      values.push(JSON.stringify(output));
    }
    if (started_at !== undefined) {
      updates.push(`started_at = $${values.length + 1}`);
      values.push(started_at);
    }
    if (finished_at !== undefined) {
      updates.push(`finished_at = $${values.length + 1}`);
      values.push(finished_at);
    }
    if (tokens_in !== undefined) {
      updates.push(`tokens_in = $${values.length + 1}`);
      values.push(tokens_in);
    }
    if (tokens_out !== undefined) {
      updates.push(`tokens_out = $${values.length + 1}`);
      values.push(tokens_out);
    }
    if (cost_usd !== undefined) {
      updates.push(`cost_usd = $${values.length + 1}`);
      values.push(cost_usd);
    }

    const isTerminal = ['done', 'dead', 'cancelled'].includes(queue_state);
    if (isTerminal) {
      updates.push(`finished_at = COALESCE(finished_at, NOW())`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await dbQuery(
      `UPDATE deo.agent_jobs SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (jobError !== undefined) {
      await dbQuery(
        `UPDATE deo.task_executions SET error = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(jobError), job.execution_id]
      );
    }

    if (isTerminal) {
      await cascadeExecutionStatus(job.execution_id);

      // Reflect terminal execution status onto parent task
      const execNow = await dbQuery(
        `SELECT status FROM deo.task_executions WHERE id = $1`,
        [job.execution_id]
      );
      const execStatus = execNow.rows[0]?.status;
      if (execStatus === 'succeeded') {
        await dbQuery(
          `UPDATE deo.tasks SET execution_status = 'success', updated_at = NOW() WHERE id = $1`,
          [job.task_id]
        );
      } else if (execStatus === 'failed') {
        await dbQuery(
          `UPDATE deo.tasks SET execution_status = 'failed', updated_at = NOW() WHERE id = $1`,
          [job.task_id]
        );
      }
    }

    req.auditData = {
      entity_type: 'agent_job',
      entity_id: req.params.id,
      old_values: { queue_state: job.queue_state },
      new_values: { queue_state },
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Patch agent job status error', error);
    res.status(500).json({ error: 'Failed to update agent job status' });
  }
});

agentJobsRouter.post('/:id/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const job = await fetchAgentJobScoped(req.params.id, req.user.company_id);
    if (!job) return res.status(404).json({ error: 'Agent job not found' });

    const { append, line } = req.body;
    const addition = append ?? (line !== undefined ? `${line}\n` : null);
    if (typeof addition !== 'string' || addition.length === 0) {
      return res.status(400).json({ error: 'append (string) or line (string) required' });
    }

    const newTail = appendLogTail(job.log_tail, addition);
    const result = await dbQuery(
      `UPDATE deo.agent_jobs SET log_tail = $1, updated_at = NOW() WHERE id = $2 RETURNING id, log_tail`,
      [newTail, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Append agent job log error', error);
    res.status(500).json({ error: 'Failed to append log' });
  }
});

agentJobsRouter.post('/:id/retry', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const job = await fetchAgentJobScoped(req.params.id, req.user.company_id);
    if (!job) return res.status(404).json({ error: 'Agent job not found' });

    const { input } = req.body;

    const result = await createExecutionAndEnqueue({
      taskId: job.task_id,
      companyId: req.user.company_id,
      triggeredBy: req.user.id,
      triggerReason: 'retry',
      runtimeType: job.runtime_type,
      agentId: job.agent_id,
      input: input || job.input || {},
      parentExecutionId: job.execution_id,
    });

    req.auditData = {
      entity_type: 'agent_job',
      entity_id: result.agentJob.id,
      new_values: {
        previous_agent_job_id: req.params.id,
        previous_execution_id: job.execution_id,
        new_execution_id: result.execution.id,
      },
    };

    res.status(201).json(result);
  } catch (error) {
    console.error('Retry agent job error', error);
    res.status(500).json({ error: 'Failed to retry agent job' });
  }
});

// ============================================================
// legacyJobsRouter — /api/jobs/* (DEPRECATED, removed in PR3)
//
// Existing clients call /api/jobs treating each row as both task and job.
// PR2 keeps these endpoints as a thin compatibility layer over the new
// task / task_executions / agent_jobs schema. New integrations should
// use POST /api/tasks/:id/executions and the /api/agent-jobs/* endpoints.
// ============================================================
export const legacyJobsRouter = Router();

legacyJobsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset } = getPaginationParams(req.query);
    const { status } = req.query;

    let queryStr = `SELECT * FROM deo.tasks WHERE company_id = $1`;
    const params: any[] = [req.user.company_id];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        created_at: task.created_at,
      })),
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List legacy jobs error', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

legacyJobsRouter.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, priority, runtime_type, input } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.tasks (id, company_id, title, description, status, priority, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [taskId, req.user.company_id, title, description || null, 'open', priority || 'medium', req.user.id]
    );

    const created = await createExecutionAndEnqueue({
      taskId,
      companyId: req.user.company_id,
      triggeredBy: req.user.id,
      triggerReason: 'manual',
      runtimeType: runtime_type,
      input,
    });

    req.auditData = {
      entity_type: 'job',
      entity_id: taskId,
      new_values: { title, status: 'open', execution_id: created.execution.id, agent_job_id: created.agentJob.id },
    };

    res.status(201).json({
      id: taskId,
      title,
      status: 'open',
      execution_id: created.execution.id,
      agent_job_id: created.agentJob.id,
      created_at: created.execution.created_at,
    });
  } catch (error) {
    console.error('Create legacy job error', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

legacyJobsRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `SELECT t.*,
              te.id AS latest_execution_id,
              te.status AS latest_execution_status,
              te.attempt_number AS latest_attempt_number,
              aj.id AS latest_agent_job_id,
              aj.queue_state AS latest_agent_job_state,
              aj.runtime_type AS latest_agent_job_runtime_type
         FROM deo.tasks t
         LEFT JOIN LATERAL (
           SELECT * FROM deo.task_executions
            WHERE task_id = t.id
            ORDER BY attempt_number DESC LIMIT 1
         ) te ON true
         LEFT JOIN LATERAL (
           SELECT * FROM deo.agent_jobs
            WHERE execution_id = te.id
            ORDER BY sequence_index DESC, created_at DESC LIMIT 1
         ) aj ON true
         WHERE t.id = $1 AND t.company_id = $2`,
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const task = result.rows[0];

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to,
      latest_execution: task.latest_execution_id
        ? {
            id: task.latest_execution_id,
            status: task.latest_execution_status,
            attempt_number: task.latest_attempt_number,
          }
        : null,
      latest_agent_job: task.latest_agent_job_id
        ? {
            id: task.latest_agent_job_id,
            queue_state: task.latest_agent_job_state,
            runtime_type: task.latest_agent_job_runtime_type,
          }
        : null,
      created_at: task.created_at,
      updated_at: task.updated_at,
    });
  } catch (error) {
    console.error('Get legacy job error', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

legacyJobsRouter.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const jobId = req.params.id;
    const oldResult = await dbQuery(
      'SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [jobId, req.user.company_id]
    );

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const oldJob = oldResult.rows[0];
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const result = await dbQuery(
      `UPDATE deo.tasks SET status = $1, updated_at = NOW()
        WHERE id = $2 AND company_id = $3 RETURNING *`,
      [status, jobId, req.user.company_id]
    );

    req.auditData = {
      entity_type: 'job',
      entity_id: jobId,
      old_values: oldJob,
      new_values: result.rows[0],
    };

    const task = result.rows[0];
    res.json({
      id: task.id,
      title: task.title,
      status: task.status,
      updated_at: task.updated_at,
    });
  } catch (error) {
    console.error('Update legacy job error', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

legacyJobsRouter.post('/:id/messages', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const jobId = req.params.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const jobResult = await dbQuery(
      'SELECT id FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [jobId, req.user.company_id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const messageId = uuidv4();
    const messageKey = `job:${jobId}:messages`;

    await redis.lpush(
      messageKey,
      JSON.stringify({
        id: messageId,
        job_id: jobId,
        sender_id: req.user.id,
        content,
        timestamp: new Date().toISOString(),
      })
    );

    req.auditData = {
      entity_type: 'job_message',
      entity_id: messageId,
      new_values: { job_id: jobId, content },
    };

    res.status(201).json({
      id: messageId,
      job_id: jobId,
      sender_id: req.user.id,
      content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create legacy job message error', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

legacyJobsRouter.post('/:id/retry', authMiddleware, async (req: AuditedRequest, res: Response) => {
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
      return res.status(404).json({ error: 'Job not found' });
    }

    const latest = await dbQuery(
      `SELECT id FROM deo.task_executions
        WHERE task_id = $1
        ORDER BY attempt_number DESC LIMIT 1`,
      [taskId]
    );
    const parentExecutionId = latest.rows[0]?.id || null;

    await dbQuery(
      `UPDATE deo.tasks SET status = 'open', updated_at = NOW() WHERE id = $1`,
      [taskId]
    );

    const created = await createExecutionAndEnqueue({
      taskId,
      companyId: req.user.company_id,
      triggeredBy: req.user.id,
      triggerReason: 'retry',
      parentExecutionId,
    });

    req.auditData = {
      entity_type: 'job',
      entity_id: taskId,
      new_values: { status: 'open', execution_id: created.execution.id, agent_job_id: created.agentJob.id },
    };

    res.json({
      id: taskId,
      status: 'open',
      execution_id: created.execution.id,
      agent_job_id: created.agentJob.id,
    });
  } catch (error) {
    console.error('Retry legacy job error', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

// ============================================================
// Helpers exported for tasks.ts (POST /api/tasks/:id/executions)
// ============================================================
export { createExecutionAndEnqueue };

export default agentJobsRouter;
