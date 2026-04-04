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

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset } = getPaginationParams(req.query);
    const { status, source, assigned_to } = req.query;

    let queryStr = 'SELECT * FROM deo.leads WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (source) {
      queryStr += ` AND source = $${params.length + 1}`;
      params.push(source);
    }

    if (assigned_to) {
      queryStr += ` AND assigned_to = $${params.length + 1}`;
      params.push(assigned_to);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List leads error', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, email, phone, source, assigned_to } = req.body;

    if (!name || !email || !phone || !source) {
      return res.status(400).json({ error: 'Name, email, phone, and source are required' });
    }

    const leadId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.leads (id, company_id, name, email, phone, source, status, score, assigned_to, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [leadId, req.user.company_id, name, email, phone, source, 'new', 50, assigned_to || null]
    );

    req.auditData = {
      entity_type: 'lead',
      entity_id: leadId,
      new_values: { name, email, source, status: 'new' },
    };

    const result = await dbQuery('SELECT * FROM deo.leads WHERE id = $1', [leadId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lead error', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.leads WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lead error', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const leadId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.leads WHERE id = $1 AND company_id = $2', [leadId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const oldLead = oldResult.rows[0];
    const { name, email, phone, status, score, assigned_to } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${values.length + 1}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${values.length + 1}`);
      values.push(phone);
    }
    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (score !== undefined) {
      updates.push(`score = $${values.length + 1}`);
      values.push(score);
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${values.length + 1}`);
      values.push(assigned_to);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(leadId, req.user.company_id);

    const queryStr = `UPDATE deo.leads SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;

    const result = await dbQuery(queryStr, values);

    req.auditData = {
      entity_type: 'lead',
      entity_id: leadId,
      old_values: oldLead,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lead error', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const leadId = req.params.id;

    const result = await dbQuery(
      'DELETE FROM deo.leads WHERE id = $1 AND company_id = $2 RETURNING *',
      [leadId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    req.auditData = {
      entity_type: 'lead',
      entity_id: leadId,
      old_values: result.rows[0],
    };

    res.status(204).send();
  } catch (error) {
    console.error('Delete lead error', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

router.post('/:id/interactions', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const leadId = req.params.id;
    const { interaction_type, subject, notes, duration_minutes } = req.body;

    if (!interaction_type || !subject) {
      return res.status(400).json({ error: 'Interaction type and subject are required' });
    }

    const leadResult = await dbQuery(
      'SELECT * FROM deo.leads WHERE id = $1 AND company_id = $2',
      [leadId, req.user.company_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const interactionId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.interactions (id, company_id, lead_id, user_id, interaction_type, subject, notes, duration_minutes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [interactionId, req.user.company_id, leadId, req.user.id, interaction_type, subject, notes || null, duration_minutes || null]
    );

    req.auditData = {
      entity_type: 'interaction',
      entity_id: interactionId,
      new_values: { lead_id: leadId, interaction_type, subject },
    };

    const result = await dbQuery('SELECT * FROM deo.interactions WHERE id = $1', [interactionId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create interaction error', error);
    res.status(500).json({ error: 'Failed to create interaction' });
  }
});

router.get('/:id/interactions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset } = getPaginationParams(req.query);
    const leadId = req.params.id;

    const leadResult = await dbQuery(
      'SELECT * FROM deo.leads WHERE id = $1 AND company_id = $2',
      [leadId, req.user.company_id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.interactions WHERE lead_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [leadId, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('Get interactions error', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

export default router;
