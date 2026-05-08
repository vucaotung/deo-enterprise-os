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

    const companyResult = await dbQuery(
      `SELECT company_id
       FROM deo.staff_assignments
       WHERE user_id = $1 AND is_active = true
       ORDER BY updated_at DESC
       LIMIT 1`,
      [user.id]
    );

    const companyId = user.company_id || companyResult.rows[0]?.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID;

    const token = generateToken({
      id: user.id,
      email: user.email,
      company_id: companyId,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company_id: companyId,
        role: user.role,
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
      company_id: user.company_id,
      role: user.role,
    });
  } catch (error) {
    console.error('Get user error', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
