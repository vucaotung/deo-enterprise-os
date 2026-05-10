import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const unreadOnly = String(req.query.unreadOnly || '') === 'true';
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);

    const where = unreadOnly ? 'AND read_at IS NULL' : '';
    const result = await dbQuery(
      `SELECT id, user_id, type, title, body, link, entity_type, entity_id, read_at, created_at
         FROM deo.notifications
        WHERE user_id = $1 ${where}
        ORDER BY created_at DESC
        LIMIT $2`,
      [req.user.id, limit]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List notifications error', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const result = await dbQuery(
      `SELECT COUNT(*)::int AS count FROM deo.notifications WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    res.json({ count: result.rows[0]?.count ?? 0 });
  } catch (error) {
    console.error('Unread count error', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const result = await dbQuery(
      `UPDATE deo.notifications
          SET read_at = COALESCE(read_at, NOW())
        WHERE id = $1 AND user_id = $2
        RETURNING id, read_at`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark read error', error);
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    await dbQuery(
      `UPDATE deo.notifications SET read_at = NOW()
        WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Read all error', error);
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

export default router;
