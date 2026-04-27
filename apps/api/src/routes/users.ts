import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query as dbQuery } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// GET /api/users — list users in the caller's company
router.get('/', authMiddleware, requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  const result = await dbQuery(
    `SELECT u.id, u.email, u.full_name, u.is_active, u.last_login_at, u.created_at,
            sa.role AS company_role
       FROM deo.users u
       LEFT JOIN deo.staff_assignments sa
         ON sa.user_id = u.id AND sa.company_id = $1
      WHERE sa.company_id = $1
      ORDER BY u.created_at DESC
      LIMIT 500`,
    [req.user?.company_id]
  );
  res.json({ users: result.rows });
});

const updateSchema = z.object({
  is_active: z.boolean().optional(),
  role: z.enum(['admin', 'manager', 'staff', 'agent_handler']).optional(),
  full_name: z.string().min(1).max(255).optional(),
  password: z.string().min(8).max(128).optional(),
});

// PATCH /api/users/:id — update role / activation / password
router.patch('/:id', authMiddleware, requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
  }
  const { is_active, role, full_name, password } = parsed.data;
  const targetId = req.params.id;

  // Cannot self-disable / self-demote
  if (targetId === req.user?.id && (is_active === false || (role && role !== req.user.role))) {
    return res.status(400).json({ error: 'Cannot change own role or active status' });
  }

  // Caller scope: target must be in same company
  const scoped = await dbQuery(
    `SELECT 1 FROM deo.staff_assignments WHERE user_id = $1 AND company_id = $2`,
    [targetId, req.user?.company_id]
  );
  if (scoped.rowCount === 0) return res.status(404).json({ error: 'User not in your company' });

  const userPatch: string[] = [];
  const userParams: any[] = [];
  if (is_active !== undefined) {
    userPatch.push(`is_active = $${userPatch.length + 1}`);
    userParams.push(is_active);
  }
  if (full_name !== undefined) {
    userPatch.push(`full_name = $${userPatch.length + 1}`);
    userParams.push(full_name);
  }
  if (password !== undefined) {
    const hash = await bcrypt.hash(password, 12);
    userPatch.push(`password_hash = $${userPatch.length + 1}`);
    userParams.push(hash);
  }

  if (userPatch.length > 0) {
    userParams.push(targetId);
    userPatch.push('updated_at = NOW()');
    await dbQuery(
      `UPDATE deo.users SET ${userPatch.join(', ')} WHERE id = $${userParams.length}`,
      userParams
    );
  }

  if (role) {
    await dbQuery(
      `UPDATE deo.staff_assignments
          SET role = $1, updated_at = NOW()
        WHERE user_id = $2 AND company_id = $3`,
      [role, targetId, req.user?.company_id]
    );
  }

  res.json({ ok: true });
});

// DELETE /api/users/:id — soft-disable (does not actually delete)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user?.id) {
    return res.status(400).json({ error: 'Cannot disable yourself' });
  }
  await dbQuery(
    `UPDATE deo.users SET is_active = false, updated_at = NOW()
       WHERE id IN (
         SELECT user_id FROM deo.staff_assignments
          WHERE user_id = $1 AND company_id = $2
       )`,
    [req.params.id, req.user?.company_id]
  );
  res.json({ ok: true });
});

export default router;
