import { Router, Response } from 'express';
import { z } from 'zod';
import { query as dbQuery } from '../db';
import bcrypt from 'bcryptjs';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

async function resolvePrimaryCompany(userId: string): Promise<{ company_id: string | null; role: string | null }> {
  const r = await dbQuery(
    `SELECT company_id, role FROM deo.staff_assignments
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1`,
    [userId]
  );
  return r.rows[0] || { company_id: null, role: null };
}

router.post('/login', async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await dbQuery('SELECT * FROM deo.users WHERE lower(email) = lower($1)', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account has no password set; use invite link' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    const assignment = await resolvePrimaryCompany(user.id);
    const effectiveRole = assignment.role || user.role || 'staff';

    await dbQuery(
      'UPDATE deo.users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    const token = generateToken({
      id: user.id,
      email: user.email,
      company_id: assignment.company_id,
      role: effectiveRole,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.name,
        company_id: assignment.company_id,
        role: effectiveRole,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

const signupSchema = z.object({
  code: z.string().min(8),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(255).optional(),
});

router.post('/signup', async (req, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
  }
  const { code, password, full_name } = parsed.data;

  const inv = await dbQuery(
    `SELECT id, email, full_name, role, company_id, expires_at, used_at
       FROM deo.invites WHERE code = $1`,
    [code]
  );
  const invite = inv.rows[0];
  if (!invite) return res.status(404).json({ error: 'Invite not found' });
  if (invite.used_at) return res.status(410).json({ error: 'Invite already used' });
  if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: 'Invite expired' });

  const hash = await bcrypt.hash(password, 12);
  const displayName = full_name || invite.full_name || invite.email.split('@')[0];

  // Upsert by email (someone may have a stub user from earlier invite without password)
  const userRes = await dbQuery(
    `INSERT INTO deo.users (name, full_name, email, role, is_active, password_hash)
     VALUES ($1, $1, lower($2), $3, true, $4)
     ON CONFLICT (email) DO UPDATE
       SET name = COALESCE(deo.users.name, EXCLUDED.name),
           full_name = COALESCE(deo.users.full_name, EXCLUDED.full_name),
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           is_active = true,
           updated_at = NOW()
     RETURNING id, email`,
    [displayName, invite.email, invite.role, hash]
  );
  const user = userRes.rows[0];

  if (invite.company_id) {
    await dbQuery(
      `INSERT INTO deo.staff_assignments (user_id, company_id, role, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id, company_id) DO UPDATE
         SET role = EXCLUDED.role, is_active = true, updated_at = NOW()`,
      [user.id, invite.company_id, invite.role]
    );
  }

  await dbQuery(
    `UPDATE deo.invites SET used_at = NOW(), used_by = $2 WHERE id = $1`,
    [invite.id, user.id]
  );

  const token = generateToken({
    id: user.id,
    email: user.email,
    company_id: invite.company_id,
    role: invite.role,
  });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: displayName,
      company_id: invite.company_id,
      role: invite.role,
    },
  });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await dbQuery('SELECT * FROM deo.users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      company_id: user.company_id,
      role: user.role,
    });
  } catch (error) {
    console.error('Get user error', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
