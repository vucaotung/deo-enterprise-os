import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { ServiceRequest, serviceTokenMiddleware } from '../middleware/service-auth';
import { popAgentJob } from '../orchestrator/dispatcher';

const router = Router();
const LOG_TAIL_MAX = 16384;

const appendLogTail = (current: string | null, addition: string): string => {
  const next = (current || '') + addition;
  return next.length <= LOG_TAIL_MAX ? next : next.slice(next.length - LOG_TAIL_MAX);
};

const buildQueueKey = (runtimeType: string, companyId: string): string =>
  `jobs:queue:${runtimeType}:${companyId}`;

const fetchJobForRunner = async (agentJobId: string) => {
  const result = await dbQuery(
    `SELECT aj.id, aj.execution_id, aj.agent_id, aj.runtime_type, aj.input, aj.queue_state,
            aj.log_tail, te.task_id, te.attempt_number,
            t.company_id, t.title AS task_title, t.description AS task_description,
            a.name AS agent_name, a.display_name AS agent_display_name, a.config AS agent_config
       FROM deo.agent_jobs aj
       JOIN deo.task_executions te ON te.id = aj.execution_id
       JOIN deo.tasks t ON t.id = te.task_id
       LEFT JOIN deo.agents a ON a.id = aj.agent_id
      WHERE aj.id = $1`,
    [agentJobId]
  );
  return result.rows[0] || null;
};

const serializeJob = (job: any) => ({
  id: job.id,
  execution_id: job.execution_id,
  task_id: job.task_id,
  agent_id: job.agent_id,
  runtime_type: job.runtime_type,
  queue_state: job.queue_state,
  input: job.input || {},
  task: {
    id: job.task_id,
    title: job.task_title,
    description: job.task_description,
    company_id: job.company_id,
  },
  agent: job.agent_id
    ? {
        id: job.agent_id,
        name: job.agent_name,
        display_name: job.agent_display_name,
        config: job.agent_config || {},
      }
    : null,
});

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
  if (!row || row.has_active) return null;

  let newStatus: string | null = null;
  if (row.terminal_bad > 0) newStatus = 'failed';
  else if (row.done_count > 0 && row.done_count === row.total) newStatus = 'succeeded';
  if (!newStatus) return null;

  await dbQuery(
    `UPDATE deo.task_executions
       SET status = $1,
           finished_at = COALESCE(finished_at, NOW()),
           updated_at = NOW()
     WHERE id = $2
       AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
    [newStatus, executionId]
  );
  return newStatus;
};

router.use(serviceTokenMiddleware);

router.post('/claim', async (req: ServiceRequest, res: Response) => {
  try {
    const runtimeType = String(req.body?.runtime_type || 'claude-code');
    const companyId = req.body?.company_id ? String(req.body.company_id) : null;
    const agentId = req.body?.agent_id ? String(req.body.agent_id) : null;

    let candidates: string[] = [];
    if (companyId) {
      const queueKey = buildQueueKey(runtimeType, companyId);
      const popped = await popAgentJob(queueKey);
      if (popped) candidates.push(popped);
    }

    if (candidates.length === 0) {
      const queued = await dbQuery(
        `SELECT aj.id
           FROM deo.agent_jobs aj
           JOIN deo.task_executions te ON te.id = aj.execution_id
           JOIN deo.tasks t ON t.id = te.task_id
          WHERE aj.runtime_type = $1
            AND aj.queue_state = 'queued'
            AND ($2::uuid IS NULL OR aj.agent_id = $2::uuid)
            AND ($3::uuid IS NULL OR t.company_id = $3::uuid)
          ORDER BY aj.created_at ASC
          LIMIT 5`,
        [runtimeType, agentId, companyId]
      );
      candidates = queued.rows.map((row) => row.id);
    }

    for (const candidateId of candidates) {
      const claimed = await dbQuery(
        `UPDATE deo.agent_jobs
            SET queue_state = 'claimed',
                started_at = COALESCE(started_at, NOW()),
                updated_at = NOW()
          WHERE id = $1
            AND queue_state = 'queued'
          RETURNING id`,
        [candidateId]
      );
      if (claimed.rowCount === 0) continue;

      const job = await fetchJobForRunner(candidateId);
      if (!job) continue;

      await dbQuery(
        `UPDATE deo.task_executions
            SET status = 'running', started_at = COALESCE(started_at, NOW()), updated_at = NOW()
          WHERE id = $1
            AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
        [job.execution_id]
      );

      return res.json({ job: serializeJob(job) });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Agent runner claim error', error);
    res.status(500).json({ error: 'Failed to claim agent job' });
  }
});

router.post('/jobs/:id/logs', async (req: ServiceRequest, res: Response) => {
  try {
    const job = await fetchJobForRunner(req.params.id);
    if (!job) return res.status(404).json({ error: 'Agent job not found' });
    const addition = typeof req.body?.append === 'string' ? req.body.append : typeof req.body?.line === 'string' ? `${req.body.line}\n` : null;
    if (!addition) return res.status(400).json({ error: 'append or line required' });

    const logTail = appendLogTail(job.log_tail, addition);
    const result = await dbQuery(
      `UPDATE deo.agent_jobs SET log_tail = $1, updated_at = NOW() WHERE id = $2 RETURNING id, log_tail`,
      [logTail, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Agent runner log error', error);
    res.status(500).json({ error: 'Failed to append log' });
  }
});

router.patch('/jobs/:id/status', async (req: ServiceRequest, res: Response) => {
  try {
    const job = await fetchJobForRunner(req.params.id);
    if (!job) return res.status(404).json({ error: 'Agent job not found' });

    const queueState = req.body?.queue_state;
    if (!['claimed', 'running', 'done', 'dead', 'cancelled'].includes(queueState)) {
      return res.status(400).json({ error: 'Invalid queue_state' });
    }

    const result = await dbQuery(
      `UPDATE deo.agent_jobs
          SET queue_state = $1,
              output = COALESCE($2::jsonb, output),
              log_tail = CASE WHEN $3::text IS NULL THEN log_tail ELSE $3 END,
              tokens_in = COALESCE($4, tokens_in),
              tokens_out = COALESCE($5, tokens_out),
              cost_usd = COALESCE($6, cost_usd),
              finished_at = CASE WHEN $1 IN ('done','dead','cancelled') THEN COALESCE(finished_at, NOW()) ELSE finished_at END,
              updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
      [
        queueState,
        req.body?.output !== undefined ? JSON.stringify(req.body.output) : null,
        typeof req.body?.log_tail === 'string' ? appendLogTail(job.log_tail, req.body.log_tail) : null,
        req.body?.tokens_in ?? null,
        req.body?.tokens_out ?? null,
        req.body?.cost_usd ?? null,
        req.params.id,
      ]
    );

    if (req.body?.error !== undefined) {
      await dbQuery(
        `UPDATE deo.task_executions SET error = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(req.body.error), job.execution_id]
      );
    }

    if (['done', 'dead', 'cancelled'].includes(queueState)) {
      const executionStatus = await cascadeExecutionStatus(job.execution_id);
      if (executionStatus === 'succeeded') {
        await dbQuery(`UPDATE deo.tasks SET execution_status = 'success', updated_at = NOW() WHERE id = $1`, [job.task_id]);
      } else if (executionStatus === 'failed') {
        await dbQuery(`UPDATE deo.tasks SET execution_status = 'failed', updated_at = NOW() WHERE id = $1`, [job.task_id]);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Agent runner status error', error);
    res.status(500).json({ error: 'Failed to update agent job status' });
  }
});

export default router;
