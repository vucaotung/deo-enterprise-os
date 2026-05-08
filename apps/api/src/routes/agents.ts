import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AuditedRequest } from '../middleware/audit';
import * as redis from '../redis';

const router = Router();

const getPaginationParams = (query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

router.post('/register', async (req: any, res: Response) => {
  try {
    const {
      name,
      display_name,
      type,
      runtime_type,
      capabilities,
      config,
      heartbeat_interval_s,
    } = req.body;

    if (!name || !display_name) {
      return res.status(400).json({ error: 'name and display_name are required' });
    }

    const result = await dbQuery(
      `INSERT INTO deo.agents
         (name, display_name, type, status, runtime_type, capabilities, config, heartbeat_interval_s, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         type = EXCLUDED.type,
         status = EXCLUDED.status,
         runtime_type = COALESCE(EXCLUDED.runtime_type, deo.agents.runtime_type),
         capabilities = EXCLUDED.capabilities,
         config = COALESCE(EXCLUDED.config, deo.agents.config),
         heartbeat_interval_s = COALESCE(EXCLUDED.heartbeat_interval_s, deo.agents.heartbeat_interval_s),
         updated_at = NOW()
       RETURNING *`,
      [
        name,
        display_name,
        type || 'ai',
        'online',
        runtime_type || null,
        JSON.stringify(capabilities || []),
        config ? JSON.stringify(config) : null,
        heartbeat_interval_s || null,
      ]
    );

    const agent = result.rows[0];
    const agentKey = `agent:${agent.id}`;
    await redis.set(
      agentKey,
      JSON.stringify({ id: agent.id, status: 'online', last_heartbeat: new Date().toISOString() }),
      { EX: 3600 }
    );

    res.status(201).json(agent);
  } catch (error) {
    console.error('Register agent error', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

router.post('/:id/heartbeat', async (req: any, res: Response) => {
  try {
    const agentId = req.params.id;

    const result = await dbQuery('SELECT id FROM deo.agents WHERE id = $1', [agentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await dbQuery(
      'UPDATE deo.agents SET status = $1, last_heartbeat = NOW(), updated_at = NOW() WHERE id = $2',
      ['online', agentId]
    );

    const agentKey = `agent:${agentId}`;
    await redis.set(
      agentKey,
      JSON.stringify({ id: agentId, status: 'online', last_heartbeat: new Date().toISOString() }),
      { EX: 3600 }
    );

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Agent heartbeat error', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset } = getPaginationParams(req.query);
    const { status, runtime_type } = req.query;

    let queryStr = 'SELECT * FROM deo.agents WHERE 1 = 1';
    const params: any[] = [];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    if (runtime_type) {
      queryStr += ` AND runtime_type = $${params.length + 1}`;
      params.push(runtime_type);
    }

    queryStr += ` ORDER BY last_heartbeat DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List agents error', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery('SELECT * FROM deo.agents WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get agent error', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const agentId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.agents WHERE id = $1', [agentId]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const oldAgent = oldResult.rows[0];
    const { display_name, type, status, runtime_type, capabilities, config, heartbeat_interval_s } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (display_name !== undefined) {
      updates.push(`display_name = $${values.length + 1}`);
      values.push(display_name);
    }
    if (type !== undefined) {
      updates.push(`type = $${values.length + 1}`);
      values.push(type);
    }
    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (runtime_type !== undefined) {
      updates.push(`runtime_type = $${values.length + 1}`);
      values.push(runtime_type);
    }
    if (capabilities !== undefined) {
      updates.push(`capabilities = $${values.length + 1}`);
      values.push(JSON.stringify(capabilities));
    }
    if (config !== undefined) {
      updates.push(`config = $${values.length + 1}`);
      values.push(JSON.stringify(config));
    }
    if (heartbeat_interval_s !== undefined) {
      updates.push(`heartbeat_interval_s = $${values.length + 1}`);
      values.push(heartbeat_interval_s);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(agentId);

    const queryStr = `UPDATE deo.agents SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await dbQuery(queryStr, values);

    req.auditData = {
      entity_type: 'agent',
      entity_id: agentId,
      old_values: oldAgent,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update agent error', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Legacy: agents pulled tasks directly. New flow goes through agent_jobs queue
// (see worker.ts and POST /api/tasks/:id/executions). This endpoint claims one
// queued agent_job for the calling agent if one is available for its runtime.
router.get('/:id/pull', async (req: any, res: Response) => {
  try {
    const agentId = req.params.id;

    const agentResult = await dbQuery('SELECT * FROM deo.agents WHERE id = $1', [agentId]);

    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agentResult.rows[0];

    const claimResult = await dbQuery(
      `UPDATE deo.agent_jobs aj
         SET queue_state = 'claimed',
             agent_id = $1,
             started_at = COALESCE(aj.started_at, NOW()),
             updated_at = NOW()
       WHERE aj.id = (
         SELECT id FROM deo.agent_jobs
          WHERE queue_state = 'queued'
            AND runtime_type = $2
            AND (agent_id IS NULL OR agent_id = $1)
          ORDER BY created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [agentId, agent.runtime_type || 'openclaw']
    );

    if (claimResult.rows.length === 0) {
      return res.json({ agent_job: null });
    }

    res.json({ agent_job: claimResult.rows[0] });
  } catch (error) {
    console.error('Pull agent job error', error);
    res.status(500).json({ error: 'Failed to pull agent job' });
  }
});

export default router;
