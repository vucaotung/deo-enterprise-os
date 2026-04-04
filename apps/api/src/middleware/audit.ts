import { Request, Response, NextFunction } from 'express';
import { query as dbQuery } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from './auth';

export interface AuditedRequest extends AuthRequest {
  auditData?: {
    entity_type: string;
    entity_id: string;
    old_values?: any;
    new_values?: any;
  };
}

export async function logAuditEvent(
  req: AuditedRequest,
  action: string,
  entity_type: string,
  entity_id: string,
  oldValues?: any,
  newValues?: any
) {
  try {
    if (!req.user) {
      return;
    }

    const auditId = uuidv4();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    await dbQuery(
      `INSERT INTO deo.audit_events (id, company_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        auditId,
        req.user.company_id,
        req.user.id,
        action,
        entity_type,
        entity_id,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ip,
      ]
    );
  } catch (error) {
    console.error('Failed to log audit event', { error });
  }
}

export function auditMiddleware(req: AuditedRequest, res: Response, next: NextFunction) {
  const originalJson = res.json;

  res.json = function (data: any) {
    if (req.auditData && req.user) {
      logAuditEvent(
        req,
        req.method,
        req.auditData.entity_type,
        req.auditData.entity_id,
        req.auditData.old_values,
        req.auditData.new_values
      ).catch((error) => {
        console.error('Audit logging failed', error);
      });
    }

    return originalJson.call(this, data);
  };

  next();
}

export default auditMiddleware;
