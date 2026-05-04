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
    const { entity_type, entity_id, is_pinned, search } = req.query;

    let queryStr = 'SELECT * FROM deo.notebooks WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (entity_type) {
      queryStr += ` AND entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }

    if (entity_id) {
      queryStr += ` AND entity_id = $${params.length + 1}`;
      params.push(entity_id);
    }

    if (is_pinned === 'true') {
      queryStr += ` AND is_pinned = true`;
    }

    if (search) {
      queryStr += ` AND (title ILIKE $${params.length + 1} OR content ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    queryStr += ` ORDER BY ${is_pinned === 'true' ? 'is_pinned DESC, ' : ''}created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List notebooks error', error);
    res.status(500).json({ error: 'Failed to fetch notebooks' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, content, entity_type, entity_id, is_pinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const notebookId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.notebooks (id, company_id, title, content, entity_type, entity_id, created_by, is_pinned, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [notebookId, req.user.company_id, title, content, entity_type || null, entity_id || null, req.user.id, is_pinned || false]
    );

    req.auditData = {
      entity_type: 'notebook',
      entity_id: notebookId,
      new_values: { title, is_pinned: is_pinned || false },
    };

    const result = await dbQuery('SELECT * FROM deo.notebooks WHERE id = $1', [notebookId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create notebook error', error);
    res.status(500).json({ error: 'Failed to create notebook' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.notebooks WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get notebook error', error);
    res.status(500).json({ error: 'Failed to fetch notebook' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const notebookId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.notebooks WHERE id = $1 AND company_id = $2', [notebookId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const oldNotebook = oldResult.rows[0];
    const { title, content, is_pinned } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${values.length + 1}`);
      values.push(content);
    }
    if (is_pinned !== undefined) {
      updates.push(`is_pinned = $${values.length + 1}`);
      values.push(is_pinned);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(notebookId, req.user.company_id);

    const queryStr = `UPDATE deo.notebooks SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;

    const result = await dbQuery(queryStr, values);

    req.auditData = {
      entity_type: 'notebook',
      entity_id: notebookId,
      old_values: oldNotebook,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update notebook error', error);
    res.status(500).json({ error: 'Failed to update notebook' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const notebookId = req.params.id;

    const result = await dbQuery(
      'DELETE FROM deo.notebooks WHERE id = $1 AND company_id = $2 RETURNING *',
      [notebookId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    req.auditData = {
      entity_type: 'notebook',
      entity_id: notebookId,
      old_values: result.rows[0],
    };

    res.status(204).send();
  } catch (error) {
    console.error('Delete notebook error', error);
    res.status(500).json({ error: 'Failed to delete notebook' });
  }
});

export default router;
