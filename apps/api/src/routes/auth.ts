import { Router, Response } from 'express';
import { query as dbQuery } from '../db';
import bcrypt from 'bcryptjs';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await dbQuery('SELECT * FROM deo.users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Prefer role from staff_assignments (enforced hierarchy) over users.role
    const assignmentResult = await dbQuery(
      `SELECT company_id, role
       FROM deo.staff_assignments
       WHERE user_id = $1 AND is_active = true
       ORDER BY updated_at DESC
       LIMIT 1`,
      [user.id]
    );

    const companyId =
      user.company_id ||
      assignmentResult.rows[0]?.company_id ||
      process.env.ENTERPRISE_OS_MCP_COMPANY_ID;

    const effectiveRole =
      assignmentResult.rows[0]?.role || user.role || 'staff';

    const token = generateToken({
      id: user.id,
      email: user.email,
      company_id: companyId,
      role: effectiveRole,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company_id: companyId,
        role: effectiveRole,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Login failed' });
  }
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
      department: user.department,
      company_id: user.company_id,
      role: req.user.role,
    });
  } catch (error) {
    console.error('Get user error', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { full_name, avatar_url, department } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (full_name !== undefined) {
      params.push(full_name);
      updates.push(`full_name = $${params.length}`);
    }
    if (avatar_url !== undefined) {
      params.push(avatar_url);
      updates.push(`avatar_url = $${params.length}`);
    }
    if (department !== undefined) {
      params.push(department);
      updates.push(`department = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    params.push(req.user.id);
    const result = await dbQuery(
      `UPDATE deo.users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING id, email, full_name, avatar_url, department, company_id`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'old_password and new_password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const result = await dbQuery(
      'SELECT password_hash FROM deo.users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(old_password, result.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await dbQuery(
      'UPDATE deo.users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.get('/me/memberships', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;

    const [companiesResult, projectsResult, tasksResult] = await Promise.all([
      dbQuery(
        `SELECT c.id, c.name, sa.role, sa.is_active
         FROM deo.companies c
         JOIN deo.staff_assignments sa ON sa.company_id = c.id
         WHERE sa.user_id = $1
         ORDER BY sa.is_active DESC, c.name`,
        [userId]
      ),
      dbQuery(
        `SELECT DISTINCT p.id, p.name, p.status, p.company_id
         FROM deo.projects p
         JOIN deo.tasks t ON t.project_id = p.id
         WHERE t.assigned_to = $1
         ORDER BY p.name`,
        [userId]
      ),
      dbQuery(
        `SELECT t.id, t.title, t.status, t.project_id, p.name AS project_name
         FROM deo.tasks t
         LEFT JOIN deo.projects p ON p.id = t.project_id
         WHERE t.assigned_to = $1
           AND t.status NOT IN ('completed','cancelled')
         ORDER BY t.created_at DESC
         LIMIT 20`,
        [userId]
      ),
    ]);

    res.json({
      companies: companiesResult.rows,
      projects: projectsResult.rows,
      tasks: tasksResult.rows,
    });
  } catch (error) {
    console.error('Get memberships error', error);
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
});

export default router;
