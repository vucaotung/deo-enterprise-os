import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { sendMail, inviteEmailBody } from '../lib/email';

const router = Router();

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(255).optional(),
  role: z.enum(['admin', 'manager', 'staff', 'agent_handler']).default('staff'),
  company_id: z.string().uuid().optional(),
});

function makeCode(): string {
  return crypto.randomBytes(24).toString('base64url');
}

function frontendUrl(): string {
  return (process.env.FRONTEND_URL || 'https://dash.enterpriseos.bond').replace(/\/$/, '');
}

// POST /api/invites — admin/manager creates an invite
router.post('/', authMiddleware, requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
  }
  const { email, full_name, role, company_id } = parsed.data;

  const targetCompany = company_id || req.user?.company_id;
  if (!targetCompany) {
    return res.status(400).json({ error: 'company_id required (no default in token)' });
  }

  // Block invites for already-active users
  const existing = await dbQuery(
    'SELECT id, is_active FROM deo.users WHERE lower(email) = lower($1)',
    [email]
  );
  if (existing.rows[0]?.is_active && existing.rows[0]?.password_hash) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const code = makeCode();
  const result = await dbQuery(
    `INSERT INTO deo.invites (code, email, full_name, company_id, role, created_by)
     VALUES ($1, lower($2), $3, $4, $5, $6)
     RETURNING id, code, email, role, expires_at, created_at`,
    [code, email, full_name || null, targetCompany, role, req.user?.id || null]
  );
  const invite = result.rows[0];

  const inviteUrl = `${frontendUrl()}/signup?code=${encodeURIComponent(code)}`;

  const companyRow = await dbQuery('SELECT name FROM deo.companies WHERE id = $1', [targetCompany]);
  const companyName = companyRow.rows[0]?.name;

  const emailResult = await sendMail({
    to: email,
    subject: `Lời mời tham gia ${companyName || 'Dẹo Enterprise OS'}`,
    text: inviteEmailBody({
      inviteUrl,
      fullName: full_name,
      companyName,
      expiresAt: new Date(invite.expires_at).toLocaleString('vi-VN'),
    }),
  });

  res.status(201).json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
    },
    invite_url: inviteUrl,
    email: emailResult,
  });
});

// GET /api/invites — admin/manager list active invites for their company
router.get('/', authMiddleware, requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  const result = await dbQuery(
    `SELECT i.id, i.email, i.full_name, i.role, i.created_at, i.expires_at, i.used_at,
            u.email AS created_by_email
       FROM deo.invites i
       LEFT JOIN deo.users u ON u.id = i.created_by
      WHERE i.company_id = $1
      ORDER BY i.created_at DESC
      LIMIT 200`,
    [req.user?.company_id]
  );
  res.json({ invites: result.rows });
});

// GET /api/invites/:code — public, validates code so signup form can prefill
router.get('/:code', async (req, res: Response) => {
  const { code } = req.params;
  const result = await dbQuery(
    `SELECT i.email, i.full_name, i.role, i.expires_at, i.used_at,
            c.name AS company_name
       FROM deo.invites i
       LEFT JOIN deo.companies c ON c.id = i.company_id
      WHERE i.code = $1`,
    [code]
  );
  const invite = result.rows[0];
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  if (invite.used_at) return res.status(410).json({ error: 'Invite already used' });
  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Invite expired' });
  }
  res.json({
    email: invite.email,
    full_name: invite.full_name,
    role: invite.role,
    company_name: invite.company_name,
    expires_at: invite.expires_at,
  });
});

// DELETE /api/invites/:id — revoke (mark used by current admin)
router.delete('/:id', authMiddleware, requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  const result = await dbQuery(
    `UPDATE deo.invites
        SET used_at = NOW(), used_by = $2
      WHERE id = $1 AND company_id = $3 AND used_at IS NULL
      RETURNING id`,
    [req.params.id, req.user?.id || null, req.user?.company_id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Invite not found or already used' });
  res.json({ ok: true });
});

export default router;
