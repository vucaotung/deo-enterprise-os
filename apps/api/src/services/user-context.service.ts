// Hook 1: User context lookup for before_chat injection.
// Spec: HOOKS_PLAN.md Phase 2 — lookup user by (channel, externalId), return inject string.
//
// TODO(sprint-d-3): wire vào `deo.user_identities` table khi auth module land.
// Hiện tại return null cho mọi user — agent path "unknown user" theo spec.

import type { Pool } from 'pg';
import type { UserRole } from './rate-limit.service.js';

export interface UserContext {
  userId: string;
  fullName: string;
  role: UserRole;
  team?: string;
  timezone: string;
}

export interface UserContextDeps {
  pool: Pool;
}

export const lookupUserByChannel = async (
  _deps: UserContextDeps,
  _channel: string,
  _externalId: string
): Promise<UserContext | null> => {
  // TODO: implement after Sprint D-3 lands user_identities.
  return null;
};

export const buildContextInject = (u: UserContext): string => {
  const parts: string[] = [`User: ${u.fullName}`, `Role: ${u.role}`];
  if (u.team) parts.push(`Team: ${u.team}`);
  parts.push(`Timezone: ${u.timezone}`);
  return parts.join(' | ');
};
