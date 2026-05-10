import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createTaskComment } from '../services/comments.service';

const router = Router({ mergeParams: true });

router.get('/:taskId/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { taskId } = req.params;
    const companyId = req.user.company_id;

    const taskCheck = await dbQuery(
      'SELECT id FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [taskId, companyId]
    );
    if (taskCheck.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const result = await dbQuery(
      `SELECT c.*,
              CASE
                WHEN c.author_type = 'user' THEN COALESCE(u.name, u.email)
                WHEN c.author_type = 'agent' THEN COALESCE(a.display_name, a.name, c.author_id)
                ELSE c.author_id
              END AS author_display
         FROM deo.task_comments c
         LEFT JOIN deo.users u ON c.author_type = 'user' AND u.id::text = c.author_id
         LEFT JOIN deo.agents a ON c.author_type = 'agent' AND (a.id::text = c.author_id OR a.name = c.author_id)
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC`,
      [taskId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List task comments error', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:taskId/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { taskId } = req.params;
    const companyId = req.user.company_id;

    const taskCheck = await dbQuery(
      'SELECT id FROM deo.tasks WHERE id = $1 AND company_id = $2',
      [taskId, companyId]
    );
    if (taskCheck.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const { content, parent_id, content_type } = req.body || {};
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const enriched = await createTaskComment({
      task_id: taskId,
      author_type: 'user',
      author_id: req.user.id,
      content: content.trim(),
      content_type,
      parent_id,
      source: 'web',
    });

    res.status(201).json(enriched);
  } catch (error) {
    console.error('Create task comment error', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
