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
  correlationId?: string,
  rawBody?: any
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
        JSON.stringify({
          ...data,
          user_id: userId,
          _correlation_id: correlationId,
          _raw: rawBody,
        }),
      ]
    );
  } catch (error) {
    console.error(`[hooks] Failed to log ${eventType}:`, error);
  }
}

// Helper: GoClaw có thể gửi nhiều tên field khác nhau cho cùng concept
function pickField(body: any, ...names: string[]): any {
  if (!body) return undefined;
  for (const n of names) {
    if (body[n] !== undefined) return body[n];
  }
  return undefined;
}

// ──────────────────────────────────────────────
// POST /internal/hooks/session-start
// Triggered: khi user bắt đầu session mới với agent
// ──────────────────────────────────────────────

router.post('/session-start', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const body = req.body || {};
  const agent_id = pickField(body, 'agent_id', 'agentId', 'agent');
  const user_id = pickField(body, 'user_id', 'userId', 'user');
  const session_id = pickField(body, 'session_id', 'sessionId', 'session');
  const channel = pickField(body, 'channel', 'source');
  const tenant_id = pickField(body, 'tenant_id', 'tenantId', 'tenant');

  await logHookEvent(
    'goclaw.session.start',
    agent_id,
    user_id,
    { session_id, channel, tenant_id },
    req.correlationId,
    body
  );

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

  const body = req.body || {};
  const agent_id = pickField(body, 'agent_id', 'agentId', 'agent');
  const user_id = pickField(body, 'user_id', 'userId', 'user');
  const session_id = pickField(body, 'session_id', 'sessionId', 'session');
  const channel = pickField(body, 'channel', 'source');
  const message_preview = pickField(body, 'message_preview', 'message', 'prompt', 'content');
  const intent = pickField(body, 'intent');

  await logHookEvent(
    'goclaw.prompt.submit',
    agent_id,
    user_id,
    { session_id, channel, message_preview: message_preview?.slice?.(0, 200), intent },
    req.correlationId,
    body
  );

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

  const body = req.body || {};
  const agent_id = pickField(body, 'agent_id', 'agentId', 'agent');
  const user_id = pickField(body, 'user_id', 'userId', 'user');
  const tool_name = pickField(body, 'tool_name', 'toolName', 'tool', 'name');
  const tool_input_preview = pickField(body, 'tool_input_preview', 'toolInput', 'input', 'arguments');

  await logHookEvent(
    'goclaw.tool.pre_use',
    agent_id,
    user_id,
    { tool_name, tool_input_preview },
    req.correlationId,
    body
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/post-tool-use
// Triggered: sau khi tool được gọi xong (success hoặc error)
// ──────────────────────────────────────────────

router.post('/post-tool-use', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const body = req.body || {};
  const agent_id = pickField(body, 'agent_id', 'agentId', 'agent');
  const user_id = pickField(body, 'user_id', 'userId', 'user');
  const tool_name = pickField(body, 'tool_name', 'toolName', 'tool', 'name');
  const success = pickField(body, 'success', 'ok');
  const error_message = pickField(body, 'error_message', 'error', 'errorMessage');
  const duration_ms = pickField(body, 'duration_ms', 'durationMs', 'duration');

  await logHookEvent(
    'goclaw.tool.post_use',
    agent_id,
    user_id,
    { tool_name, success, error_message, duration_ms },
    req.correlationId,
    body
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/run-stop
// Triggered: khi agent hoàn tất xử lý request (trả lời xong)
// ──────────────────────────────────────────────

router.post('/run-stop', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const body = req.body || {};
  const agent_id = pickField(body, 'agent_id', 'agentId', 'agent');
  const user_id = pickField(body, 'user_id', 'userId', 'user');
  const session_id = pickField(body, 'session_id', 'sessionId', 'session');
  const reason = pickField(body, 'reason', 'stop_reason');
  const tokens_used = pickField(body, 'tokens_used', 'tokensUsed', 'tokens');
  const duration_ms = pickField(body, 'duration_ms', 'durationMs', 'duration');

  await logHookEvent(
    'goclaw.run.stop',
    agent_id,
    user_id,
    { session_id, reason, tokens_used, duration_ms },
    req.correlationId,
    body
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/subagent-start
// Triggered: khi agent gọi một subagent
// ──────────────────────────────────────────────

router.post('/subagent-start', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const body = req.body || {};
  const parent_agent_id = pickField(body, 'parent_agent_id', 'parentAgentId', 'parent', 'agent_id');
  const subagent_id = pickField(body, 'subagent_id', 'subagentId', 'subagent', 'child_agent');
  const user_id = pickField(body, 'user_id', 'userId', 'user');
  const task_description = pickField(body, 'task_description', 'taskDescription', 'description', 'task');

  await logHookEvent(
    'goclaw.subagent.start',
    parent_agent_id,
    user_id,
    { subagent_id, task_description: task_description?.slice?.(0, 500) },
    req.correlationId,
    body
  );
});

// ──────────────────────────────────────────────
// POST /internal/hooks/subagent-stop
// Triggered: khi subagent hoàn thành
// ──────────────────────────────────────────────

router.post('/subagent-stop', async (req: HookRequest, res: Response) => {
  res.sendStatus(200);

  const body = req.body || {};
  const parent_agent_id = pickField(body, 'parent_agent_id', 'parentAgentId', 'parent', 'agent_id');
  const subagent_id = pickField(body, 'subagent_id', 'subagentId', 'subagent', 'child_agent');
  const user_id = pickField(body, 'user_id', 'userId', 'user');
  const success = pickField(body, 'success', 'ok');
  const result_preview = pickField(body, 'result_preview', 'result', 'output');
  const duration_ms = pickField(body, 'duration_ms', 'durationMs', 'duration');

  await logHookEvent(
    'goclaw.subagent.stop',
    parent_agent_id,
    user_id,
    { subagent_id, success, result_preview: result_preview?.slice?.(0, 500), duration_ms },
    req.correlationId,
    body
  );
});

export default router;
