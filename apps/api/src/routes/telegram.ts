import express, { Request, Response } from 'express';
import axios from 'axios';
import pool from '../config/database';
import { createTaskComment } from '../services/comments.service';

const router = express.Router();

const BOT_TOKENS: Record<string, string> = {
  main: process.env.TELEGRAM_BOT_MAIN || '',
  admin: process.env.TELEGRAM_BOT_ADMIN || '',
  phapche: process.env.TELEGRAM_BOT_PHAPCHE || '',
  ketoan: process.env.TELEGRAM_BOT_KETOAN || '',
  dieuphoi: process.env.TELEGRAM_BOT_DIEUPHOI || '',
};

async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  if (!botToken) return;
  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Telegram send error:', error);
  }
}

async function resolveUserByTelegramId(telegramId: number | string): Promise<{ id: string; company_id: string | null } | null> {
  const result = await pool.query(
    'SELECT id, company_id FROM deo.users WHERE telegram_id = $1 LIMIT 1',
    [String(telegramId)]
  );
  return result.rows[0] || null;
}

async function upsertConversation(opts: {
  channelId: string;
  userId: string | null;
  taskId: string;
}) {
  const existing = await pool.query(
    `SELECT id FROM deo.conversations
      WHERE channel = 'telegram' AND channel_id = $1 AND task_id = $2
      LIMIT 1`,
    [opts.channelId, opts.taskId]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const inserted = await pool.query(
    `INSERT INTO deo.conversations (channel, channel_id, user_id, task_id, status)
     VALUES ('telegram', $1, $2, $3, 'open')
     RETURNING id`,
    [opts.channelId, opts.userId, opts.taskId]
  );
  return inserted.rows[0].id;
}

async function findTaskByShortPrefix(prefix: string): Promise<string | null> {
  if (!/^[0-9a-f]{4,32}$/i.test(prefix)) return null;
  const result = await pool.query(
    `SELECT id FROM deo.tasks WHERE id::text LIKE $1 LIMIT 1`,
    [prefix.toLowerCase() + '%']
  );
  return result.rows[0]?.id || null;
}

async function findLatestTaskForChat(channelId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT task_id FROM deo.conversations
      WHERE channel = 'telegram' AND channel_id = $1 AND task_id IS NOT NULL
      ORDER BY created_at DESC LIMIT 1`,
    [channelId]
  );
  return result.rows[0]?.task_id || null;
}

router.post('/webhook/:botName', async (req: Request, res: Response) => {
  const { botName } = req.params;
  const update = req.body;
  res.sendStatus(200);

  const botToken = BOT_TOKENS[botName];
  if (!botToken) {
    console.error(`Unknown bot: ${botName}`);
    return;
  }

  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const channelId = String(chatId);
  const text = message.text.trim();
  const tgUserId = message.from?.id;

  console.log(`[${botName}] ${tgUserId}: ${text}`);

  try {
    const deoUser = tgUserId ? await resolveUserByTelegramId(tgUserId) : null;

    if (text === '/start') {
      await sendTelegramMessage(
        botToken,
        chatId,
        `🤖 <b>Dẹo Enterprise OS</b>\n\nLệnh:\n/task <tên> - Tạo task\nGõ tin nhắn thường để bình luận vào task gần nhất\nKèm #TASK-xxxxxxxx để bình luận đúng task`
      );
      return;
    }

    if (text.startsWith('/task ')) {
      const title = text.replace('/task ', '').trim();
      if (!title) {
        await sendTelegramMessage(botToken, chatId, '❌ Cú pháp: /task <tên>');
        return;
      }

      const companyId = deoUser?.company_id || process.env.ENTERPRISE_OS_MCP_COMPANY_ID || null;
      const result = await pool.query(
        `INSERT INTO deo.tasks (company_id, title, status, workflow_status, priority, description, created_by, created_at, updated_at)
         VALUES ($1, $2, 'todo', 'todo', 'medium', $3, $4, NOW(), NOW())
         RETURNING id, title, status`,
        [companyId, title, `Tạo từ Telegram bot ${botName}`, deoUser?.id || null]
      );
      const taskRow = result.rows[0];

      await upsertConversation({
        channelId,
        userId: deoUser?.id || null,
        taskId: taskRow.id,
      });

      await sendTelegramMessage(
        botToken,
        chatId,
        `✅ Đã tạo task: <b>${escapeHtml(taskRow.title)}</b>\nID: <code>TASK-${taskRow.id.slice(0, 8)}</code>\nStatus: ${taskRow.status}\n\nReply trong chat này để bình luận vào task.`
      );
      return;
    }

    // Freeform → comment on task
    let taskId: string | null = null;
    const tagMatch = text.match(/#TASK-([0-9a-f]{4,32})/i);
    if (tagMatch) {
      taskId = await findTaskByShortPrefix(tagMatch[1]);
    }
    if (!taskId) {
      taskId = await findLatestTaskForChat(channelId);
    }

    if (!taskId) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `❓ Chưa có task nào để bình luận. Tạo trước bằng <code>/task &lt;tên&gt;</code>.`
      );
      return;
    }

    await createTaskComment({
      task_id: taskId,
      author_type: 'user',
      author_id: deoUser?.id || `tg:${tgUserId}`,
      content: text,
      source: 'telegram',
    });

    // Bind conversation if not yet bound for this task.
    await upsertConversation({
      channelId,
      userId: deoUser?.id || null,
      taskId,
    });

    await sendTelegramMessage(
      botToken,
      chatId,
      `✅ Đã thêm bình luận vào TASK-${taskId.slice(0, 8)}`
    );
  } catch (error) {
    console.error('Telegram webhook error:', error);
    await sendTelegramMessage(botToken, chatId, '❌ Lỗi xử lý tin nhắn.');
  }
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default router;
