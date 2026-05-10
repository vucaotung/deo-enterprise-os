import { query as dbQuery } from '../db';
import { emitToUser } from '../realtime';

export type NotificationType =
  | 'mention'
  | 'assignment'
  | 'agent_update'
  | 'review_required'
  | 'job_done'
  | 'comment';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
}

export async function emitNotification(userId: string, payload: NotificationPayload) {
  if (!userId) return;
  try {
    const result = await dbQuery(
      `INSERT INTO deo.notifications (user_id, type, title, body, link, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, type, title, body, link, entity_type, entity_id, read_at, created_at`,
      [
        userId,
        payload.type,
        payload.title,
        payload.body ?? null,
        payload.link ?? null,
        payload.entity_type ?? null,
        payload.entity_id ?? null,
      ]
    );
    const row = result.rows[0];
    emitToUser(userId, 'notification', row);
    return row;
  } catch (error) {
    console.error('emitNotification failed', { userId, payload, error });
    return null;
  }
}
