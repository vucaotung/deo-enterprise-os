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
    const { category_type } = req.query;

    let queryStr = 'SELECT * FROM deo.categories WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (category_type) {
      queryStr += ` AND category_type = $${params.length + 1}`;
      params.push(category_type);
    }

    queryStr += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List categories error', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, description, color, icon, category_type } = req.body;

    if (!name || !category_type) {
      return res.status(400).json({ error: 'Name and category type are required' });
    }

    const categoryId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.categories (id, company_id, name, description, color, icon, category_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [categoryId, req.user.company_id, name, description || null, color || '#000000', icon || null, category_type]
    );

    req.auditData = {
      entity_type: 'category',
      entity_id: categoryId,
      new_values: { name, category_type },
    };

    const result = await dbQuery('SELECT * FROM deo.categories WHERE id = $1', [categoryId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.categories WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get category error', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const categoryId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.categories WHERE id = $1 AND company_id = $2', [categoryId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const oldCategory = oldResult.rows[0];
    const { name, description, color, icon } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (color !== undefined) {
      updates.push(`color = $${values.length + 1}`);
      values.push(color);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${values.length + 1}`);
      values.push(icon);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(categoryId, req.user.company_id);

    const queryStr = `UPDATE deo.categories SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;

    const result = await dbQuery(queryStr, values);

    req.auditData = {
      entity_type: 'category',
      entity_id: categoryId,
      old_values: oldCategory,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const categoryId = req.params.id;

    const result = await dbQuery(
      'DELETE FROM deo.categories WHERE id = $1 AND company_id = $2 RETURNING *',
      [categoryId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    req.auditData = {
      entity_type: 'category',
      entity_id: categoryId,
      old_values: result.rows[0],
    };

    res.status(204).send();
  } catch (error) {
    console.error('Delete category error', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
