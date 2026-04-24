// ============================================================
// Approvals API — Request, decide, list
// ============================================================
import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Resolve the authenticated user's worker_id.
 * Returns null if the user has no corresponding worker row.
 */
async function resolveWorkerId(userId: string, companyId: string): Promise<string | null> {
  const result = await dbQuery(
    `SELECT id FROM deo.workers WHERE user_id = $1 AND company_id = $2 LIMIT 1`,
    [userId, companyId]
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
}

// ============================================================
// GET /api/approvals — List with filters
// ============================================================
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { status, assigned_to, project_id, entity_type } = req.query;

    let where = 'WHERE a.company_id = $1';
    const params: any[] = [req.user.company_id];

    if (status) {
      where += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }
    if (assigned_to) {
      where += ` AND a.assigned_to = $${params.length + 1}`;
      params.push(assigned_to);
    }
    if (project_id) {
      where += ` AND a.project_id = $${params.length + 1}`;
      params.push(project_id);
    }
    if (entity_type) {
      where += ` AND a.entity_type = $${params.length + 1}`;
      params.push(entity_type);
    }

    const result = await dbQuery(
      `SELECT a.*,
         json_build_object('id', rw.id, 'display_name', rw.display_name, 'worker_type', rw.worker_type) AS requester,
         json_build_object('id', aw.id, 'display_name', aw.display_name, 'worker_type', aw.worker_type) AS assignee,
         CASE
           WHEN a.entity_type = 'task' THEN (SELECT title FROM deo.tasks WHERE id = a.entity_id)
           WHEN a.entity_type = 'project' THEN (SELECT name FROM deo.projects WHERE id = a.entity_id)
           ELSE NULL
         END AS entity_title
       FROM deo.approvals a
       LEFT JOIN deo.workers rw ON rw.id = a.requested_by
       LEFT JOIN deo.workers aw ON aw.id = a.assigned_to
       ${where}
       ORDER BY
         CASE a.status WHEN 'pending' THEN 0 ELSE 1 END,
         a.created_at DESC`,
      params
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('List approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// ============================================================
// GET /api/approvals/:id — Detail
// ============================================================
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery(
      `SELECT a.*,
         json_build_object('id', rw.id, 'display_name', rw.display_name, 'worker_type', rw.worker_type, 'email', rw.email) AS requester,
         json_build_object('id', aw.id, 'display_name', aw.display_name, 'worker_type', aw.worker_type, 'email', aw.email) AS assignee,
         CASE
           WHEN a.entity_type = 'task' THEN (SELECT title FROM deo.tasks WHERE id = a.entity_id)
           WHEN a.entity_type = 'project' THEN (SELECT name FROM deo.projects WHERE id = a.entity_id)
           ELSE NULL
         END AS entity_title
       FROM deo.approvals a
       LEFT JOIN deo.workers rw ON rw.id = a.requested_by
       LEFT JOIN deo.workers aw ON aw.id = a.assigned_to
       WHERE a.id = $1 AND a.company_id = $2`,
      [req.params.id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get approval error:', error);
    res.status(500).json({ error: 'Failed to fetch approval' });
  }
});

// ============================================================
// POST /api/approvals — Create approval request
// FIX: Bind requested_by to the authenticated user's worker identity
// ============================================================
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { entity_type, entity_id, assigned_to, project_id, due_at, metadata } = req.body;

    if (!entity_type || !entity_id || !assigned_to) {
      return res.status(400).json({ error: 'entity_type, entity_id, and assigned_to are required' });
    }

    // Resolve the authenticated user's worker_id — do NOT trust body params
    const requesterId = await resolveWorkerId(req.user.id, req.user.company_id);
    if (!requesterId) {
      return res.status(403).json({ error: 'You do not have a worker profile in this company' });
    }

    // Validate that assigned_to worker belongs to the same company
    const assigneeCheck = await dbQuery(
      `SELECT id FROM deo.workers WHERE id = $1 AND company_id = $2`,
      [assigned_to, req.user.company_id]
    );
    if (assigneeCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Assigned worker not found in this company' });
    }

    // If project_id provided, validate it belongs to the same company
    if (project_id) {
      const projectCheck = await dbQuery(
        `SELECT id FROM deo.projects WHERE id = $1 AND company_id = $2`,
        [project_id, req.user.company_id]
      );
      if (projectCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Project not found in this company' });
      }
    }

    const approvalId = uuidv4();

    const result = await dbQuery(
      `INSERT INTO deo.approvals (id, entity_type, entity_id, requested_by, assigned_to, project_id, company_id, due_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [approvalId, entity_type, entity_id, requesterId, assigned_to,
       project_id || null, req.user.company_id, due_at || null,
       JSON.stringify(metadata || {})]
    );

    // Log activity
    await dbQuery(
      `INSERT INTO deo.activity_logs (action, actor_type, actor_id, entity_type, entity_id, project_id, company_id, summary)
       VALUES ('approval_requested', 'human', $1, $2, $3, $4, $5, $6)`,
      [requesterId, entity_type, entity_id, project_id || null, req.user.company_id, 'Approval requested']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create approval error:', error);
    res.status(500).json({ error: 'Failed to create approval' });
  }
});

// ============================================================
// POST /api/approvals/:id/decide — Approve or reject
// FIX: Enforce that the authenticated user IS the assigned approver
// ============================================================
router.post('/:id/decide', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { status, decision_note } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    // Resolve the authenticated user's worker_id
    const deciderId = await resolveWorkerId(req.user.id, req.user.company_id);
    if (!deciderId) {
      return res.status(403).json({ error: 'You do not have a worker profile in this company' });
    }

    // Only the assigned approver (or an owner_admin) may decide
    const approval = await dbQuery(
      `SELECT a.* FROM deo.approvals a
       WHERE a.id = $1 AND a.status = 'pending' AND a.company_id = $2`,
      [id, req.user.company_id]
    );

    if (approval.rows.length === 0) {
      return res.status(404).json({ error: 'Approval not found or already decided' });
    }

    const row = approval.rows[0];

    // Check: is the user the assigned approver, or do they hold owner_admin role?
    if (row.assigned_to !== deciderId) {
      const isAdmin = await dbQuery(
        `SELECT 1 FROM deo.worker_roles wr
         JOIN deo.roles r ON r.id = wr.role_id
         WHERE wr.worker_id = $1 AND r.key = 'owner_admin'
         LIMIT 1`,
        [deciderId]
      );
      if (isAdmin.rows.length === 0) {
        return res.status(403).json({ error: 'Only the assigned approver or an admin may decide this approval' });
      }
    }

    const result = await dbQuery(
      `UPDATE deo.approvals
       SET status = $1, decision_note = $2, decided_at = NOW(), decided_by = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, decision_note || null, deciderId, id]
    );

    const updated = result.rows[0];

    // Log activity
    const action = status === 'approved' ? 'approval_approved' : 'approval_rejected';
    await dbQuery(
      `INSERT INTO deo.activity_logs (action, actor_type, actor_id, entity_type, entity_id, project_id, company_id, summary)
       VALUES ($1, 'human', $2, $3, $4, $5, $6, $7)`,
      [action, deciderId, updated.entity_type, updated.entity_id,
       updated.project_id, updated.company_id,
       `${status === 'approved' ? 'Approved' : 'Rejected'}${decision_note ? ': ' + decision_note : ''}`]
    );

    res.json(updated);
  } catch (error) {
    console.error('Decide approval error:', error);
    res.status(500).json({ error: 'Failed to decide approval' });
  }
});

export default router;
