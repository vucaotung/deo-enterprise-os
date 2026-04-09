// ============================================================
// Approvals API — Request, decide, list
// ============================================================
import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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
// ============================================================
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { entity_type, entity_id, assigned_to, requested_by, project_id, due_at, metadata } = req.body;

    if (!entity_type || !entity_id || !assigned_to || !requested_by) {
      return res.status(400).json({ error: 'entity_type, entity_id, assigned_to, and requested_by are required' });
    }

    const approvalId = uuidv4();

    const result = await dbQuery(
      `INSERT INTO deo.approvals (id, entity_type, entity_id, requested_by, assigned_to, project_id, company_id, due_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [approvalId, entity_type, entity_id, requested_by, assigned_to,
       project_id || null, req.user.company_id, due_at || null,
       JSON.stringify(metadata || {})]
    );

    // Log activity
    await dbQuery(
      `INSERT INTO deo.activity_logs (action, actor_type, actor_id, entity_type, entity_id, project_id, company_id, summary)
       VALUES ('approval_requested', 'human', $1, $2, $3, $4, $5, $6)`,
      [requested_by, entity_type, entity_id, project_id || null, req.user.company_id, 'Approval requested']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create approval error:', error);
    res.status(500).json({ error: 'Failed to create approval' });
  }
});

// ============================================================
// POST /api/approvals/:id/decide — Approve or reject
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

    const result = await dbQuery(
      `UPDATE deo.approvals
       SET status = $1, decision_note = $2, decided_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND status = 'pending' AND company_id = $4
       RETURNING *`,
      [status, decision_note || null, id, req.user.company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Approval not found or already decided' });
    }

    const approval = result.rows[0];

    // Log activity
    const action = status === 'approved' ? 'approval_approved' : 'approval_rejected';
    await dbQuery(
      `INSERT INTO deo.activity_logs (action, actor_type, actor_id, entity_type, entity_id, project_id, company_id, summary)
       VALUES ($1, 'human', $2, $3, $4, $5, $6, $7)`,
      [action, approval.assigned_to, approval.entity_type, approval.entity_id,
       approval.project_id, approval.company_id,
       `${status === 'approved' ? 'Approved' : 'Rejected'}${decision_note ? ': ' + decision_note : ''}`]
    );

    res.json(approval);
  } catch (error) {
    console.error('Decide approval error:', error);
    res.status(500).json({ error: 'Failed to decide approval' });
  }
});

export default router;
