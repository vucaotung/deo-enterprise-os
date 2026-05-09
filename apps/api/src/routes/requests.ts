import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { serviceTokenMiddleware, ServiceRequest } from '../middleware/service-auth';

const router = Router();

// Accept either a user JWT or a service token (for agent comments)
function flexAuth(req: any, res: Response, next: any) {
  const hasServiceToken = req.headers['x-service-token'] ||
    (req.headers.authorization && !req.headers.authorization.startsWith('Bearer eyJ'));
  if (hasServiceToken) {
    return serviceTokenMiddleware(req, res, next);
  }
  return authMiddleware(req, res, next);
}

// GET /api/requests — list requests for the company
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const companyId = req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID;
    const { status, type, assigned_agent } = req.query;

    const params: any[] = [companyId];
    let where = 'r.company_id = $1';

    if (status) {
      params.push(status);
      where += ` AND r.status = $${params.length}`;
    }
    if (type) {
      params.push(type);
      where += ` AND r.type = $${params.length}`;
    }
    if (assigned_agent) {
      params.push(assigned_agent);
      where += ` AND r.assigned_agent = $${params.length}`;
    }

    const result = await dbQuery(
      `SELECT r.*,
              u.full_name  AS created_by_name,
              a.display_name AS agent_name
       FROM deo.requests r
       LEFT JOIN deo.users u  ON u.id = r.created_by
       LEFT JOIN deo.agents a ON a.id = r.assigned_agent
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT 100`,
      params
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List requests error', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// POST /api/requests — create a new request
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { title, description, type, priority, context_type, context_id, metadata } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required' });

    const companyId = req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID;

    const result = await dbQuery(
      `INSERT INTO deo.requests
         (title, description, type, priority, company_id, created_by, context_type, context_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        description || null,
        type || 'general',
        priority || 'normal',
        companyId,
        req.user.id,
        context_type || null,
        context_id || null,
        metadata ? JSON.stringify(metadata) : '{}',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create request error', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /api/requests/:id — request detail + context object
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const result = await dbQuery(
      `SELECT r.*,
              u.full_name    AS created_by_name,
              u.email        AS created_by_email,
              a.display_name AS agent_name,
              a.name         AS agent_slug
       FROM deo.requests r
       LEFT JOIN deo.users u  ON u.id = r.created_by
       LEFT JOIN deo.agents a ON a.id = r.assigned_agent
       WHERE r.id = $1 AND r.company_id = $2`,
      [req.params.id, req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

    const request = result.rows[0];

    // Attach linked context object if present
    let contextObject: any = null;
    if (request.context_type && request.context_id) {
      const tableMap: Record<string, string> = {
        task: 'deo.tasks',
        project: 'deo.projects',
        expense: 'deo.expenses',
      };
      const table = tableMap[request.context_type];
      if (table) {
        const ctx = await dbQuery(`SELECT * FROM ${table} WHERE id = $1`, [request.context_id]);
        contextObject = ctx.rows[0] || null;
      }
    }

    res.json({ ...request, context_object: contextObject });
  } catch (error) {
    console.error('Get request error', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// PATCH /api/requests/:id — update status, assigned_agent, etc.
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { status, assigned_agent, priority, title, description } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
      if (['resolved', 'closed'].includes(status)) {
        updates.push(`resolved_at = NOW()`);
      }
    }
    if (assigned_agent !== undefined) {
      params.push(assigned_agent);
      updates.push(`assigned_agent = $${params.length}`);
    }
    if (priority !== undefined) {
      params.push(priority);
      updates.push(`priority = $${params.length}`);
    }
    if (title !== undefined) {
      params.push(title);
      updates.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    params.push(req.params.id);
    params.push(req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID);

    const result = await dbQuery(
      `UPDATE deo.requests
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length - 1} AND company_id = $${params.length}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update request error', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// GET /api/requests/:id/comments — threaded comments
router.get('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const result = await dbQuery(
      `SELECT c.*
       FROM deo.request_comments c
       JOIN deo.requests r ON r.id = c.request_id
       WHERE c.request_id = $1
         AND r.company_id = $2
       ORDER BY c.created_at ASC`,
      [req.params.id, req.user.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get comments error', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/requests/:id/comments — add comment (user JWT or agent service token)
router.post('/:id/comments', flexAuth, async (req: any, res: Response) => {
  try {
    const { content, content_type, action_result, parent_id, author_type, author_id } = req.body;

    if (!content) return res.status(400).json({ error: 'content is required' });

    // Determine author from JWT user or explicit fields (for agents)
    const resolvedAuthorType = author_type || (req.user ? 'user' : 'agent');
    const resolvedAuthorId = author_id || req.user?.id;

    if (!resolvedAuthorId) {
      return res.status(400).json({ error: 'author_id is required for agent comments' });
    }

    const result = await dbQuery(
      `INSERT INTO deo.request_comments
         (request_id, author_type, author_id, content, content_type, action_result, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.params.id,
        resolvedAuthorType,
        resolvedAuthorId,
        content,
        content_type || 'text',
        action_result ? JSON.stringify(action_result) : null,
        parent_id || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create comment error', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// PATCH /api/requests/:id/comments/:cid — edit comment
router.patch('/:id/comments/:cid', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const result = await dbQuery(
      `UPDATE deo.request_comments
       SET content = $1
       WHERE id = $2 AND request_id = $3 AND author_id = $4
       RETURNING *`,
      [content, req.params.cid, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not owned by you' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update comment error', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

export default router;
