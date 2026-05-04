import { ActorType } from '../enums.js';

export interface AuditEvent {
  id: string;
  companyId: string;
  correlationId: string | null;
  actorType: ActorType;
  actorId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}
