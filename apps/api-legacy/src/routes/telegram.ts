import express, { Request, Response } from 'express';
import axios from 'axios';
import pool from '../config/database';

const router = express.Router();

const BOT_TOKENS: Record<string, string> = {
  main: process.env.TELEGRAM_BOT_MAIN || '',
  admin: process.env.TELEGRAM_BOT_ADMIN || '',
  phapche: process.env.TELEGRAM_BOT_PHAPCHE || '',
  ketoan: process.env.TELEGRAM_BOT_KETOAN || '',
  dieuphoi: process.env.TELEGRAM_BOT_DIEUPHOI || '',
};

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
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
  const text = message.text.trim();
  const userId = message.from?.id;

  console.log(`[${botName}] ${userId}: ${text}`);

  try {
    if (text.startsWith('/task ')) {
      const title = text.replace('/task ', '').trim();
      if (!title) {
        await sendTelegramMessage(botToken, chatId, '❌ Format: /task [title]');
        return;
      }

      const result = await pool.query(
        `INSERT INTO deo.tasks (title, status, priority, description, created_at, updated_at)
         VALUES ($1, 'todo', 'medium', $2, NOW(), NOW()) RETURNING id, title, status`,
        [title, `Created from Telegram bot ${botName}`]
      );

      await sendTelegramMessage(
        botToken,
        chatId,
        `✅ Task created: ${result.rows[0].title}\nID: ${result.rows[0].id}\nStatus: ${result.rows[0].status}`
      );
      return;
    }

    if (text === '/start') {
      await sendTelegramMessage(
        botToken,
        chatId,
        `🤖 <b>Dẹo Enterprise OS</b>\n\nCommands:\n/task [title] - Create task`
      );
      return;
    }

    await sendTelegramMessage(botToken, chatId, `Received: ${text}`);
  } catch (error) {
    console.error('DB error:', error);
    await sendTelegramMessage(botToken, chatId, '❌ Error processing command');
  }
});

export default router;
