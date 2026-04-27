import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type Role = 'admin' | 'manager' | 'staff' | 'agent_handler';

/**
 * Restrict a route to one or more roles. authMiddleware MUST run first.
 *
 *   router.post('/users', requireRole('admin'), handler)
 *   router.post('/clarifications/:id/answer',
 *     requireRole('admin', 'manager', 'agent_handler'), handler)
 */
export function requireRole(...allowed: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role as Role | undefined;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}
