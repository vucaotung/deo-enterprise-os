import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AuditedRequest } from '../middleware/audit';
import { v4 as uuidv4 } from 'uuid';
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
    const { name, agent_type, endpoint, capabilities } = req.body;

    if (!name || !agent_type || !endpoint) {
      return res.status(400).json({ error: 'Name, agent_type, and endpoint are required' });
    }

    const agentId = uuidv4();
    const companyId = req.body.company_id || 'system';

    await dbQuery(
      `INSERT INTO deo.agents (id, company_id, name, agent_type, endpoint, status, capabilities, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [agentId, companyId, name, agent_type, endpoint, 'online', JSON.stringify(capabilities || [])]
    );

    const agentKey = `agent:${agentId}`;
    await redis.set(agentKey, JSON.stringify({ id: agentId, status: 'online', last_heartbeat: new Date().toISOString() }), { EX: 3600 });

    const result = await dbQuery('SELECT * FROM deo.agents WHERE id = $1', [agentId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Register agent error', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

router.post('/:id/heartbeat', async (req: any, res: Response) => {
  try {
    const agentId = req.params.id;

    const result = await dbQuery('SELECT * FROM deo.agents WHERE id = $1', [agentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await dbQuery(
      'UPDATE deo.agents SET status = $1, last_heartbeat = NOW(), updated_at = NOW() WHERE id = $2',
      ['online', agentId]
    );

    const agentKey = `agent:${agentId}`;
    await redis.set(agentKey, JSON.stringify({ id: agentId, status: 'online', last_heartbeat: new Date().toISOString() }), { EX: 3600 });

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
    const { status } = req.query;

    let queryStr = 'SELECT * FROM deo.agents WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY last_heartbeat DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

    const result = await dbQuery(
      'SELECT * FROM deo.agents WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );

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
    const oldResult = await dbQuery('SELECT * FROM deo.agents WHERE id = $1 AND company_id = $2', [agentId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const oldAgent = oldResult.rows[0];
    const { name, endpoint, status, capabilities } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (endpoint !== undefined) {
      updates.push(`endpoint = $${values.length + 1}`);
      values.push(endpoint);
    }
    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (capabilities !== undefined) {
      updates.push(`capabilities = $${values.length + 1}`);
      values.push(JSON.stringify(capabilities));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(agentId, req.user.company_id);

    const queryStr = `UPDATE deo.agents SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;

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

router.get('/:id/pull', async (req: any, res: Response) => {
  try {
    const agentId = req.params.id;

    const result = await dbQuery('SELECT * FROM deo.agents WHERE id = $1', [agentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const tasksResult = await dbQuery(
      `SELECT * FROM deo.tasks WHERE company_id = $1 AND status = 'open' AND (assigned_to IS NULL OR assigned_to = $2) ORDER BY created_at ASC LIMIT 1`,
      [result.rows[0].company_id, agentId]
    );

    if (tasksResult.rows.length === 0) {
      return res.json({ task: null });
    }

    const task = tasksResult.rows[0];

    await dbQuery(
      'UPDATE deo.tasks SET status = $1, assigned_to = $2, updated_at = NOW() WHERE id = $3',
      ['assigned', agentId, task.id]
    );

    res.json({ task: { ...task, status: 'assigned', assigned_to: agentId } });
  } catch (error) {
    console.error('Pull task error', error);
    res.status(500).json({ error: 'Failed to pull tasks' });
  }
});

export default router;
