import { query as dbQuery } from '../db';
import { emitToTask } from '../realtime';
import { emitNotification } from './notify.service';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_MAIN || '';

export interface CreateCommentInput {
  task_id: string;
  author_type: 'user' | 'agent';
  author_id: string;
  content: string;
  content_type?: string;
  parent_id?: string | null;
  source?: string;
  action_result?: unknown;
}

const MENTION_RE = /@([a-zA-Z0-9_.\-]{2,64})/g;

export async function createTaskComment(input: CreateCommentInput) {
  const mentionNames = extractMentionNames(input.content);
  const mentionedUserIds = mentionNames.length > 0 ? await resolveUserIdsByName(mentionNames) : [];

  const result = await dbQuery(
    `INSERT INTO deo.task_comments
       (task_id, parent_id, author_type, author_id, content, content_type, action_result, mentions, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, task_id, parent_id, author_type, author_id, content, content_type, action_result,
               mentions, source, created_at`,
    [
      input.task_id,
      input.parent_id || null,
      input.author_type,
      input.author_id,
      input.content,
      input.content_type || 'text',
      input.action_result ? JSON.stringify(input.action_result) : null,
      mentionedUserIds,
      input.source || 'web',
    ]
  );
  const comment = result.rows[0];

  const enriched = await enrichComment(comment);

  emitToTask(input.task_id, 'comment', enriched);

  // Notify mentioned users.
  await Promise.all(
    mentionedUserIds.map((uid: string) =>
      emitNotification(uid, {
        type: 'mention',
        title: `${enriched.author_display || 'Ai đó'} nhắc đến bạn`,
        body: truncate(input.content, 200),
        link: `/tasks/${input.task_id}`,
        entity_type: 'comment',
        entity_id: comment.id,
      })
    )
  );

  // Notify task creator/assignee about a new comment (skip the author).
  await notifyTaskWatchers({
    taskId: input.task_id,
    excludeUserId: input.author_type === 'user' ? input.author_id : null,
    title: `${enriched.author_display || 'Có người'} đã bình luận`,
    body: truncate(input.content, 200),
    type: input.author_type === 'agent' ? 'agent_update' : 'comment',
    link: `/tasks/${input.task_id}`,
    entityType: 'comment',
    entityId: comment.id,
  });

  // Telegram outbound bridge: if an agent posted, push to creator's Telegram chat.
  if (input.author_type === 'agent' && TELEGRAM_BOT_TOKEN) {
    await bridgeToTelegram(input.task_id, input.content, enriched.author_display);
  }

  return enriched;
}

async function enrichComment(comment: any) {
  let author_display: string | null = null;
  if (comment.author_type === 'user') {
    const r = await dbQuery(
      'SELECT name, email FROM deo.users WHERE id::text = $1 LIMIT 1',
      [comment.author_id]
    );
    if (r.rows.length > 0) author_display = r.rows[0].name || r.rows[0].email;
  } else if (comment.author_type === 'agent') {
    const r = await dbQuery(
      'SELECT display_name, name FROM deo.agents WHERE id::text = $1 OR name = $1 LIMIT 1',
      [comment.author_id]
    );
    if (r.rows.length > 0) author_display = r.rows[0].display_name || r.rows[0].name;
  }
  return { ...comment, author_display: author_display || comment.author_id };
}

function extractMentionNames(content: string): string[] {
  const matches = new Set<string>();
  for (const m of content.matchAll(MENTION_RE)) {
    if (m[1]) matches.add(m[1]);
  }
  return Array.from(matches);
}

async function resolveUserIdsByName(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const result = await dbQuery(
    `SELECT id FROM deo.users WHERE name = ANY($1) OR email = ANY($1)`,
    [names]
  );
  return result.rows.map((r: { id: string }) => r.id);
}

async function notifyTaskWatchers(opts: {
  taskId: string;
  excludeUserId: string | null;
  title: string;
  body?: string | null;
  type: 'comment' | 'agent_update';
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const r = await dbQuery(
    'SELECT created_by, assigned_to FROM deo.tasks WHERE id = $1 LIMIT 1',
    [opts.taskId]
  );
  if (r.rows.length === 0) return;
  const watchers = new Set<string>();
  if (r.rows[0].created_by) watchers.add(r.rows[0].created_by);
  if (r.rows[0].assigned_to) watchers.add(r.rows[0].assigned_to);
  if (opts.excludeUserId) watchers.delete(opts.excludeUserId);
  await Promise.all(
    Array.from(watchers).map((uid) =>
      emitNotification(uid, {
        type: opts.type,
        title: opts.title,
        body: opts.body,
        link: opts.link,
        entity_type: opts.entityType,
        entity_id: opts.entityId,
      })
    )
  );
}

async function bridgeToTelegram(taskId: string, content: string, authorDisplay?: string | null) {
  try {
    const r = await dbQuery(
      `SELECT u.telegram_id, c.channel_id, t.title AS task_title
         FROM deo.tasks t
         JOIN deo.users u ON u.id = t.created_by
         JOIN deo.conversations c ON c.task_id = t.id AND c.channel = 'telegram'
        WHERE t.id = $1
          AND COALESCE(u.notify_via_telegram, TRUE) = TRUE
          AND u.telegram_id IS NOT NULL
        ORDER BY c.created_at DESC
        LIMIT 1`,
      [taskId]
    );
    if (r.rows.length === 0) return;
    const { channel_id, task_title } = r.rows[0];
    const text = `🤖 <b>${escapeHtml(authorDisplay || 'Agent')}</b> đã bình luận vào TASK-${taskId.slice(0, 8)}\n<i>${escapeHtml(task_title || '')}</i>\n\n${escapeHtml(content)}`;
    const axios = (await import('axios')).default;
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: Number(channel_id) || channel_id, text, parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Telegram bridge failed', { taskId, error });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}
