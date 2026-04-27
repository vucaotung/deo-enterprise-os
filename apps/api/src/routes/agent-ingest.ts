import { Router, Response } from 'express';
import { z } from 'zod';
import { query as dbQuery } from '../db';
import { agentAuthMiddleware, AgentRequest } from '../middleware/agentAuth';
import * as redis from '../redis';

const router = Router();

// All routes here require agent token
router.use(agentAuthMiddleware);

// POST /api/agent-ingest/heartbeat — flips agent online + writes event
router.post('/heartbeat', async (req: AgentRequest, res: Response) => {
  const agentId = req.agent!.id;
  await dbQuery(
    `UPDATE deo.agents SET status = 'online', last_heartbeat = NOW(), updated_at = NOW()
       WHERE id = $1`,
    [agentId]
  );
  await dbQuery(
    `INSERT INTO deo.agent_events (agent_id, company_id, type, payload)
       VALUES ($1, $2, 'heartbeat', $3)`,
    [agentId, req.agent!.company_id || null, req.body || {}]
  );
  await redis.set(
    `agent:${agentId}`,
    JSON.stringify({ id: agentId, status: 'online', last_heartbeat: new Date().toISOString() }),
    { EX: 120 }
  );
  res.json({ ok: true });
});

const eventSchema = z.object({
  type: z.enum(['task_started', 'task_completed', 'task_failed', 'clarification_asked', 'log', 'error', 'metric']),
  task_id: z.string().uuid().optional(),
  payload: z.record(z.any()).optional(),
});

// POST /api/agent-ingest/events — generic event log
router.post('/events', async (req: AgentRequest, res: Response) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
  }
  const { type, task_id, payload } = parsed.data;
  const agentId = req.agent!.id;

  await dbQuery(
    `INSERT INTO deo.agent_events (agent_id, company_id, type, task_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
    [agentId, req.agent!.company_id || null, type, task_id || null, payload || {}]
  );

  // Side-effects on related task
  if (type === 'task_completed' && task_id) {
    await dbQuery(
      `UPDATE deo.tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
      [task_id]
    );
  } else if (type === 'task_started' && task_id) {
    await dbQuery(
      `UPDATE deo.tasks SET status = 'in_progress', execution_status = 'running', updated_at = NOW()
         WHERE id = $1`,
      [task_id]
    );
  } else if (type === 'task_failed' && task_id) {
    await dbQuery(
      `UPDATE deo.tasks SET execution_status = 'failed', updated_at = NOW()
         WHERE id = $1`,
      [task_id]
    );
  }

  res.status(201).json({ ok: true });
});

// GET /api/agent-ingest/jobs/next — pop one queued task assigned to this agent
router.get('/jobs/next', async (req: AgentRequest, res: Response) => {
  const agentId = req.agent!.id;
  const result = await dbQuery(
    `UPDATE deo.tasks
        SET execution_status = 'running', updated_at = NOW()
      WHERE id = (
        SELECT id FROM deo.tasks
         WHERE agent_id = $1 AND execution_status IN ('idle', 'queued')
         ORDER BY scheduled_for NULLS FIRST, created_at
         LIMIT 1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING id, title, description, context, due_date, priority`,
    [agentId]
  );

  if (result.rowCount === 0) {
    return res.json({ task: null });
  }
  res.json({ task: result.rows[0] });
});

export default router;
