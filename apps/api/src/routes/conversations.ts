import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AuditedRequest } from '../middleware/audit';
import { v4 as uuidv4 } from 'uuid';
import { contextService } from '../services/context.service';

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

    let queryStr = 'SELECT * FROM deo.conversations WHERE company_id = $1';
    const params: any[] = [req.user.company_id];

    if (status) {
      queryStr += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbQuery(queryStr, params);

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('List conversations error', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.post('/', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { agent_id, task_id, title } = req.body;

    if (!agent_id || !title) {
      return res.status(400).json({ error: 'Agent ID and title are required' });
    }

    const conversationId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.conversations (id, company_id, agent_id, task_id, title, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [conversationId, req.user.company_id, agent_id, task_id || null, title, 'active']
    );

    req.auditData = {
      entity_type: 'conversation',
      entity_id: conversationId,
      new_values: { agent_id, title, status: 'active' },
    };

    const result = await dbQuery('SELECT * FROM deo.conversations WHERE id = $1', [conversationId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create conversation error', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { limit, offset } = getPaginationParams(req.query);
    const conversationId = req.params.id;

    const convResult = await dbQuery(
      'SELECT * FROM deo.conversations WHERE id = $1 AND company_id = $2',
      [conversationId, req.user.company_id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const result = await dbQuery(
      'SELECT * FROM deo.messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [conversationId, limit, offset]
    );

    res.json({
      data: result.rows.reverse(),
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: result.rows.length },
    });
  } catch (error) {
    console.error('Get messages error', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:id/messages', authMiddleware, async (req: AuditedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { content, attachments } = req.body;
    const conversationId = req.params.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const convResult = await dbQuery(
      'SELECT * FROM deo.conversations WHERE id = $1 AND company_id = $2',
      [conversationId, req.user.company_id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messageId = uuidv4();

    await dbQuery(
      `INSERT INTO deo.messages (id, conversation_id, sender_id, sender_type, content, attachments, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [messageId, conversationId, req.user.id, 'user', content, attachments ? JSON.stringify(attachments) : null]
    );

    await dbQuery(
      'UPDATE deo.conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    req.auditData = {
      entity_type: 'message',
      entity_id: messageId,
      new_values: { content, conversation_id: conversationId },
    };

    const result = await dbQuery('SELECT * FROM deo.messages WHERE id = $1', [messageId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create message error', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.get('/:id/context', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const conversationId = req.params.id;

    const convResult = await dbQuery(
      'SELECT * FROM deo.conversations WHERE id = $1 AND company_id = $2',
      [conversationId, req.user.company_id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const context = await contextService.getContextForConversation(conversationId);

    res.json(context);
  } catch (error) {
    console.error('Get context error', error);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});

export default router;
