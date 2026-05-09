import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 1,
  staff: 2,
  manager: 3,
  admin: 4,
  owner: 5,
};

export function requireMinRole(minRole: string) {
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    if (userLevel < minLevel) {
      return res.status(403).json({
        error: 'Forbidden',
        required_min: minRole,
        current: req.user.role,
      });
    }
    next();
  };
}
