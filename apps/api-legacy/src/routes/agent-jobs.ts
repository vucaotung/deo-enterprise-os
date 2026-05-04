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

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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
    console.error('List jobs error', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const jobId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.tasks (id, company_id, title, description, status, priority, created_by, progress_percentage, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW(), NOW())`,
      [jobId, req.user.company_id, title, description || null, 'open', priority || 'medium', req.user.id]
    );

    await redis.lpush(`jobs:queue:${req.user.company_id}`, jobId);

    req.auditData = {
      entity_type: 'job',
      entity_id: jobId,
      new_values: { title, status: 'open' },
    };

    const result = await dbQuery('SELECT * FROM deo.tasks WHERE id = $1', [jobId]);

    res.status(201).json({
      id: result.rows[0].id,
      title: result.rows[0].title,
      status: result.rows[0].status,
      created_at: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('Create job error', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2',
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
      progress_percentage: task.progress_percentage,
      created_at: task.created_at,
      updated_at: task.updated_at,
    });
  } catch (error) {
    console.error('Get job error', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const jobId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2', [jobId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const oldJob = oldResult.rows[0];
    const { status, progress_percentage } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (progress_percentage !== undefined) {
      updates.push(`progress_percentage = $${values.length + 1}`);
      values.push(progress_percentage);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(jobId, req.user.company_id);

    const queryStr = `UPDATE deo.tasks SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;

    const result = await dbQuery(queryStr, values);

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
      progress_percentage: task.progress_percentage,
      updated_at: task.updated_at,
    });
  } catch (error) {
    console.error('Update job error', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

router.post('/:id/messages', authMiddleware, async (req: AuditedRequest, res: Response) => {
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
      'SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [jobId, req.user.company_id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const messageId = uuidv4();
    const messageKey = `job:${jobId}:messages`;

    await redis.lpush(messageKey, JSON.stringify({
      id: messageId,
      job_id: jobId,
      sender_id: req.user.id,
      content,
      timestamp: new Date().toISOString(),
    }));

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
    console.error('Create job message error', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.post('/:id/retry', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const jobId = req.params.id;

    const jobResult = await dbQuery(
      'SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [jobId, req.user.company_id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = await dbQuery(
      'UPDATE deo.tasks SET status = $1, progress_percentage = 0, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['open', jobId]
    );

    await redis.lpush(`jobs:queue:${req.user.company_id}`, jobId);

    req.auditData = {
      entity_type: 'job',
      entity_id: jobId,
      new_values: { status: 'open', progress_percentage: 0 },
    };

    const task = result.rows[0];

    res.json({
      id: task.id,
      title: task.title,
      status: task.status,
      progress_percentage: task.progress_percentage,
    });
  } catch (error) {
    console.error('Retry job error', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

export default router;
