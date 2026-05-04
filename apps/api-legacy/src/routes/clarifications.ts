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
    const { status } = req.query;

    let queryStr = 'SELECT * FROM deo.clarifications WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List clarifications error', error);
    res.status(500).json({ error: 'Failed to fetch clarifications' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { conversation_id, question, context } = req.body;

    if (!conversation_id || !question) {
      return res.status(400).json({ error: 'Conversation ID and question are required' });
    }

    const clarificationId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.clarifications (id, company_id, conversation_id, question, context, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [clarificationId, req.user.company_id, conversation_id, question, context || null, 'pending']
    );

    req.auditData = {
      entity_type: 'clarification',
      entity_id: clarificationId,
      new_values: { question, status: 'pending' },
    };

    const result = await dbQuery('SELECT * FROM deo.clarifications WHERE id = $1', [clarificationId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create clarification error', error);
    res.status(500).json({ error: 'Failed to create clarification' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const clarificationId = req.params.id;
    const oldResult = await dbQuery('SELECT * FROM deo.clarifications WHERE id = $1 AND company_id = $2', [clarificationId, req.user.company_id]);

    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Clarification not found' });
    }

    const oldClarification = oldResult.rows[0];
    const { answer, status } = req.body;

    if (!answer) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const result = await dbQuery(
      `UPDATE deo.clarifications SET answer = $1, status = $2, answered_by = $3, updated_at = NOW() WHERE id = $4 AND company_id = $5 RETURNING *`,
      [answer, status || 'answered', req.user.id, clarificationId, req.user.company_id]
    );

    req.auditData = {
      entity_type: 'clarification',
      entity_id: clarificationId,
      old_values: oldClarification,
      new_values: result.rows[0],
    };

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update clarification error', error);
    res.status(500).json({ error: 'Failed to update clarification' });
  }
});

router.get('/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `SELECT * FROM deo.clarifications WHERE company_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 10`,
      [req.user.company_id]
    );

    res.json({
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get pending clarifications error', error);
    res.status(500).json({ error: 'Failed to fetch pending clarifications' });
  }
});

export default router;
