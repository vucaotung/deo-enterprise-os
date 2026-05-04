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
    const { project_id, category_id, status } = req.query;

    let queryStr = 'SELECT * FROM deo.expenses WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (project_id) {
      queryStr += ` AND project_id = $${params.length + 1}`;
      params.push(project_id);
    }

    if (category_id) {
      queryStr += ` AND category_id = $${params.length + 1}`;
      params.push(category_id);
    }

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY expense_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List expenses error', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { project_id, category_id, account_id, amount, currency, description, expense_date, receipt_url } = req.body;

    if (!amount || !description) {
      return res.status(400).json({ error: 'Amount and description are required' });
    }

    const expenseId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.expenses (id, company_id, project_id, category_id, account_id, amount, currency, description, expense_date, receipt_url, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [expenseId, req.user.company_id, project_id || null, category_id || null, account_id || null, amount, currency || 'VND', description, expense_date || new Date(), receipt_url || null, 'draft', req.user.id]
    );

    req.auditData = {
      entity_type: 'expense',
      entity_id: expenseId,
      new_values: { amount, description, status: 'draft' },
    };

    const result = await dbQuery('SELECT * FROM deo.expenses WHERE id = $1', [expenseId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create expense error', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.expenses WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get expense error', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const expenseId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.expenses WHERE id = $1 AND company_id = $2', [expenseId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const oldExpense = oldResult.rows[0];
    const { amount, description, status, category_id, project_id } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (amount !== undefined) {
      updates.push(`amount = $${values.length + 1}`);
      values.push(amount);
    }
    if (description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${values.length + 1}`);
      values.push(category_id);
    }
    if (project_id !== undefined) {
      updates.push(`project_id = $${values.length + 1}`);
      values.push(project_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(expenseId, req.user.company_id);

    const queryStr = `UPDATE deo.expenses SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`;

    const result = await dbQuery(queryStr, values);

    req.auditData = {
      entity_type: 'expense',
      entity_id: expenseId,
      old_values: oldExpense,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update expense error', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const expenseId = req.params.id;

    const result = await dbQuery(
      'DELETE FROM deo.expenses WHERE id = $1 AND company_id = $2 RETURNING *',
      [expenseId, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    req.auditData = {
      entity_type: 'expense',
      entity_id: expenseId,
      old_values: result.rows[0],
    };

    res.status(204).send();
  } catch (error) {
    console.error('Delete expense error', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

router.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `SELECT
        SUM(CAST(amount AS BIGINT)) as total_amount,
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'approved' THEN CAST(amount AS BIGINT) ELSE 0 END) as approved_amount,
        SUM(CASE WHEN status = 'pending' THEN CAST(amount AS BIGINT) ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'rejected' THEN CAST(amount AS BIGINT) ELSE 0 END) as rejected_amount
       FROM deo.expenses WHERE company_id = $1`,
      [req.user.company_id]
    );

    const data = result.rows[0];

    res.json({
      total_amount: data.total_amount ? parseInt(data.total_amount) : 0,
      total_count: parseInt(data.total_count) || 0,
      approved_amount: data.approved_amount ? parseInt(data.approved_amount) : 0,
      pending_amount: data.pending_amount ? parseInt(data.pending_amount) : 0,
      rejected_amount: data.rejected_amount ? parseInt(data.rejected_amount) : 0,
    });
  } catch (error) {
    console.error('Expenses summary error', error);
    res.status(500).json({ error: 'Failed to fetch expenses summary' });
  }
});

export default router;
