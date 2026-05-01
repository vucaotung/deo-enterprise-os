/**
 * GoClaw Lifecycle Hooks — Enterprise OS nhận events từ GoClaw
 *
 * GoClaw gửi POST đến:
 *   /internal/hooks/session-start
 *   /internal/hooks/prompt-submit
 *   /internal/hooks/pre-tool-use
 *   /internal/hooks/post-tool-use
 *   /internal/hooks/run-stop
 *   /internal/hooks/subagent-start
 *   /internal/hooks/subagent-stop
 *
 * Mục đích: audit trail, correlation tracking, agent state sync
 * Auth: X-Service-Token header
 */

import { Router, Request, Response } from 'express';
import { CorrelatedRequest } from '../middleware/correlation-id';
import { query as dbQuery } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

type HookRequest = Request & CorrelatedRequest;

// ──────────────────────────────────────────────
// Shared: log hook event to audit_events
// ──────────────────────────────────────────────

async function logHookEvent(
  eventType: string,
  agentId: string,
  userId: string | undefined,
  data: Record<string, any>,
  correlationId?: string
) {
  try {
    await dbQuery(
      `INSERT INTO deo.audit_events
         (id, event_type, actor_type, actor_id, data, channel, created_at)
       VALUES ($1, $2, 'agent', $3, $4, 'goclaw', NOW())`,
      [
        uuidv4(),
        eventType,
        agentId || 'unknown',
        JSON.stringify({ ...data, user_id: userId, _correlation_id: correlationId }),
      ]
    );
  } catch (error) {
    console.error(`[hooks] Failed to log ${eventType}:`, error);
  }
}

// ──────────────────────────────────────────────
// POST /internal/hooks/session-start
// Triggered: khi user bắt đầu session mới với agent
// ──────────────────────────────────────────────

router.post('/session-start', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const { agent_id, user_id, session_id, channel, tenant_id } = req.body;

  await logHookEvent(
    'goclaw.session.start',
    agent_id,
    user_id,
    { session_id, channel, tenant_id },
    req.correlationId
  );

  // Cập nhật agent heartbeat nếu agent đã đăng ký
  if (agent_id) {
    await dbQuery(
      `UPDATE deo.agents SET status = 'online', last_heartbeat = NOW(), updated_at = NOW()
       WHERE name = $1 OR id::text = $1`,
      [agent_id]
    ).catch(() => {});
  }
});

// ──────────────────────────────────────────────
// POST /internal/hooks/prompt-submit
// Triggered: khi user gửi tin nhắn/yêu cầu cho agent
// ──────────────────────────────────────────────

router.post('/prompt-submit', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const { agent_id, user_id, session_id, channel, message_preview, intent } = req.body;

  await logHookEvent(
    'goclaw.prompt.submit',
    agent_id,
    user_id,
    { session_id, channel, message_preview: message_preview?.slice(0, 200), intent },
    req.correlationId
  );

  // Ghi vào conversation nếu có channel
  if (user_id && channel) {
    const existingConv = await dbQuery(
      `SELECT id FROM deo.conversations WHERE channel_id = $1 AND channel = $2 AND status = 'active' LIMIT 1`,
      [session_id || user_id, channel]
    ).catch(() => ({ rows: [] }));

    if (existingConv.rows.length === 0 && session_id) {
      await dbQuery(
        `INSERT INTO deo.conversations (id, channel, channel_id, status, last_message_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', NOW(), NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [uuidv4(), channel, session_id]
      ).catch(() => {});
    }
  }
});

// ──────────────────────────────────────────────
// POST /internal/hooks/pre-tool-use
// Triggered: ngay trước khi agent gọi một tool
// ──────────────────────────────────────────────

router.post('/pre-tool-use', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const { agent_id, user_id, tool_name, tool_input_preview } = req.body;

  await logHookEvent(
    'goclaw.tool.pre_use',
    agent_id,
    user_id,
    { tool_name, tool_input_preview },
    req.correlationId
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/post-tool-use
// Triggered: sau khi tool được gọi xong (success hoặc error)
// ──────────────────────────────────────────────

router.post('/post-tool-use', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const { agent_id, user_id, tool_name, success, error_message, duration_ms } = req.body;

  await logHookEvent(
    'goclaw.tool.post_use',
    agent_id,
    user_id,
    { tool_name, success, error_message, duration_ms },
    req.correlationId
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/run-stop
// Triggered: khi agent hoàn tất xử lý request (trả lời xong)
// ──────────────────────────────────────────────

router.post('/run-stop', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const { agent_id, user_id, session_id, reason, tokens_used, duration_ms } = req.body;

  await logHookEvent(
    'goclaw.run.stop',
    agent_id,
    user_id,
    { session_id, reason, tokens_used, duration_ms },
    req.correlationId
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/subagent-start
// Triggered: khi agent gọi một subagent
// ──────────────────────────────────────────────

router.post('/subagent-start', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const { parent_agent_id, subagent_id, user_id, task_description } = req.body;

  await logHookEvent(
    'goclaw.subagent.start',
    parent_agent_id,
    user_id,
    { subagent_id, task_description: task_description?.slice(0, 500) },
    req.correlationId
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/subagent-stop
// Triggered: khi subagent hoàn thành
// ──────────────────────────────────────────────

router.post('/subagent-stop', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const { parent_agent_id, subagent_id, user_id, success, result_preview, duration_ms } = req.body;

  await logHookEvent(
    'goclaw.subagent.stop',
    parent_agent_id,
    user_id,
    { subagent_id, success, result_preview: result_preview?.slice(0, 500), duration_ms },
    req.correlationId
  );
});

export default router;
