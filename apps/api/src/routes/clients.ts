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
    const { status, search } = req.query;

    let queryStr = 'SELECT * FROM deo.clients WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      queryStr += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List clients error', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, email, phone, address, city, country, tax_id, contact_person, website, notes, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const clientId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.clients (id, company_id, name, email, phone, address, city, country, tax_id, contact_person, website, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
      [clientId, req.user.company_id, name, email, phone, address || null, city || null, country || null, tax_id || null, contact_person || null, website || null, notes || null, status || 'active']
    );

    req.auditData = {
      entity_type: 'client',
      entity_id: clientId,
      new_values: { name, email, status: status || 'active' },
    };

    const result = await dbQuery('SELECT * FROM deo.clients WHERE id = $1', [clientId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create client error', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.clients WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get client error', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clientId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.clients WHERE id = $1 AND company_id = $2', [clientId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const oldClient = oldResult.rows[0];
    const { name, email, phone, address, city, country, tax_id, contact_person, website, notes, status } = req.body;

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
    if (address !== undefined) {
      updates.push(`address = $${values.length + 1}`);
      values.push(address);
    }
    if (city !== undefined) {
      updates.push(`city = $${values.length + 1}`);
      values.push(city);
    }
    if (country !== undefined) {
      updates.push(`country = $${values.length + 1}`);
      values.push(country);
    }
    if (tax_id !== undefined) {
      updates.push(`tax_id = $${values.length + 1}`);
      values.push(tax_id);
    }
    if (contact_person !== undefined) {
      updates.push(`contact_person = $${values.length + 1}`);
      values.push(contact_person);
    }
    if (website !== undefined) {
      updates.push(`website = $${values.length + 1}`);
      values.push(website);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${values.length + 1}`);
      values.push(notes);
    }
    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(clientId, req.user.company_id);

    const queryStr = `UPDATE deo.clients SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;

    const result = await dbQuery(queryStr, values);

    req.auditData = {
      entity_type: 'client',
      entity_id: clientId,
      old_values: oldClient,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update client error', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clientId = req.params.id;

    const result = await dbQuery(
      'DELETE FROM deo.clients WHERE id = $1 AND company_id = $2 RETURNING *',
      [clientId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    req.auditData = {
      entity_type: 'client',
      entity_id: clientId,
      old_values: result.rows[0],
    };

    res.status(204).send();
  } catch (error) {
    console.error('Delete client error', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
