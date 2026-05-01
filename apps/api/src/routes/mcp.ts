/**
 * MCP Server — chuẩn JSON-RPC 2.0 (MCP Protocol 2024-11-05)
 *
 * GoClaw cấu hình:
 *   Transport:   Streamable HTTP
 *   URL:         http://localhost:3001/mcp
 *   Header:      X-Service-Token: <GOCLAW_SERVICE_TOKEN>
 *
 * JSON-RPC methods được hỗ trợ:
 *   initialize   → handshake, trả capabilities
 *   tools/list   → danh sách 8 MCP tools
 *   tools/call   → gọi tool với arguments
 *   ping         → health check
 */

import { Router, Request, Response } from 'express';
import { serviceAuthMiddleware } from '../middleware/service-auth';
import { CorrelatedRequest } from '../middleware/correlation-id';
import {
  eos_create_task,
  eos_query_tasks,
  eos_update_task_status,
  eos_get_dashboard_summary,
  eos_log_agent_action,
  eos_create_clarification,
  eos_query_clients,
  eos_register_drive_artifact,
} from '../services/mcp-tools.service';

const router = Router();

// ──────────────────────────────────────────────
// Tool definitions (MCP schema)
// ──────────────────────────────────────────────

const TOOLS = [
  {
    name: 'eos_create_task',
    description: 'Tạo task mới trong Enterprise OS. Dùng khi agent cần ghi nhận công việc cần làm.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Tiêu đề task' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        assigned_to_user_id: { type: 'string' },
        project_id: { type: 'string' },
        due_date: { type: 'string', format: 'date-time' },
        context: { type: 'object' },
        agent_id: { type: 'string' },
      },
    },
  },
  {
    name: 'eos_query_tasks',
    description: 'Truy vấn danh sách tasks theo filter.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'cancelled', 'blocked'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        assigned_to: { type: 'string' },
        project_id: { type: 'string' },
        limit: { type: 'number', default: 20, maximum: 50 },
        offset: { type: 'number', default: 0 },
      },
    },
  },
  {
    name: 'eos_update_task_status',
    description: 'Cập nhật trạng thái task.',
    inputSchema: {
      type: 'object',
      required: ['task_id', 'status'],
      properties: {
        task_id: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'cancelled', 'blocked'] },
        progress_percentage: { type: 'number', minimum: 0, maximum: 100 },
        note: { type: 'string' },
      },
    },
  },
  {
    name: 'eos_get_dashboard_summary',
    description: 'Lấy tóm tắt KPI: tasks, expenses, clients. Dùng cho daily briefing.',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: { type: 'string', enum: ['today', 'week', 'month'], default: 'month' },
      },
    },
  },
  {
    name: 'eos_log_agent_action',
    description: 'Ghi nhật ký hành động vào audit trail.',
    inputSchema: {
      type: 'object',
      required: ['agent_id', 'action_type'],
      properties: {
        agent_id: { type: 'string' },
        action_type: { type: 'string' },
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
        data: { type: 'object' },
        channel: { type: 'string' },
      },
    },
  },
  {
    name: 'eos_create_clarification',
    description: 'Tạo yêu cầu làm rõ gửi đến người dùng khi agent cần thêm thông tin.',
    inputSchema: {
      type: 'object',
      required: ['question'],
      properties: {
        task_id: { type: 'string' },
        agent_id: { type: 'string' },
        question: { type: 'string' },
        assigned_to_user_id: { type: 'string' },
        channel: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
        blocks_execution: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'eos_query_clients',
    description: 'Tìm kiếm khách hàng trong CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        limit: { type: 'number', default: 10, maximum: 30 },
      },
    },
  },
  {
    name: 'eos_register_drive_artifact',
    description: 'Đăng ký file Google Drive vào hệ thống sau khi tạo tài liệu.',
    inputSchema: {
      type: 'object',
      required: ['drive_file_id', 'drive_url', 'title'],
      properties: {
        drive_file_id: { type: 'string' },
        drive_url: { type: 'string' },
        title: { type: 'string' },
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
        agent_id: { type: 'string' },
      },
    },
  },
];

// ──────────────────────────────────────────────
// Tool handlers map
// ──────────────────────────────────────────────

const TOOL_HANDLERS: Record<string, (args: any) => Promise<any>> = {
  eos_create_task,
  eos_query_tasks,
  eos_update_task_status,
  eos_get_dashboard_summary,
  eos_log_agent_action,
  eos_create_clarification,
  eos_query_clients,
  eos_register_drive_artifact,
};

// ──────────────────────────────────────────────
// JSON-RPC helpers
// ──────────────────────────────────────────────

function rpcSuccess(id: any, result: any) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id: any, code: number, message: string, data?: any) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } };
}

// Tool result content format per MCP spec
function toolContent(data: any): { content: { type: string; text: string }[] } {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

// ──────────────────────────────────────────────
// /mcp/health — public (no auth needed)
// ──────────────────────────────────────────────

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'deo-enterprise-os-mcp',
    protocol: 'MCP 2024-11-05',
    tools_count: TOOLS.length,
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────
// POST /mcp — JSON-RPC 2.0 entrypoint (Streamable HTTP)
// ──────────────────────────────────────────────

router.post('/', serviceAuthMiddleware, async (req: Request & CorrelatedRequest, res: Response) => {
  const body = req.body;

  // Support batch requests (array of JSON-RPC calls)
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((msg) => handleRpcMessage(msg, req.correlationId)));
    return res.json(results);
  }

  const result = await handleRpcMessage(body, req.correlationId);
  return res.json(result);
});

// ──────────────────────────────────────────────
// GET /mcp/tools — REST fallback (backward compat + easy curl testing)
// ──────────────────────────────────────────────

router.get('/tools', serviceAuthMiddleware, (req: Request, res: Response) => {
  res.json({ tools: TOOLS });
});

// ──────────────────────────────────────────────
// POST /mcp/call — REST fallback (backward compat)
// ──────────────────────────────────────────────

router.post('/call', serviceAuthMiddleware, async (req: Request & CorrelatedRequest, res: Response) => {
  const { tool, arguments: args } = req.body;

  if (!tool) {
    return res.status(400).json({ error: 'Missing required field: tool' });
  }

  const handler = TOOL_HANDLERS[tool];
  if (!handler) {
    return res.status(404).json({ error: `Unknown tool: ${tool}`, available: Object.keys(TOOL_HANDLERS) });
  }

  const result = await handler({ ...args, correlation_id: req.correlationId });

  if (!result.success) {
    return res.status(422).json({ error: result.error });
  }

  return res.json({ tool, result: result.data, correlation_id: req.correlationId });
});

// ──────────────────────────────────────────────
// RPC message handler
// ──────────────────────────────────────────────

async function handleRpcMessage(msg: any, correlationId?: string): Promise<any> {
  if (!msg || msg.jsonrpc !== '2.0') {
    return rpcError(msg?.id ?? null, -32600, 'Invalid Request: missing jsonrpc 2.0');
  }

  const { id, method, params } = msg;

  switch (method) {
    // ─── Handshake ───────────────────────────
    case 'initialize':
      return rpcSuccess(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'deo-enterprise-os', version: '1.0.0' },
      });

    // ─── Ping ────────────────────────────────
    case 'ping':
      return rpcSuccess(id, {});

    // ─── Tools ───────────────────────────────
    case 'tools/list':
      return rpcSuccess(id, { tools: TOOLS });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};

      if (!toolName) {
        return rpcError(id, -32602, 'Invalid params: missing name');
      }

      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        return rpcError(id, -32601, `Method not found: tool "${toolName}" does not exist`);
      }

      try {
        const result = await handler({ ...toolArgs, correlation_id: correlationId });

        if (!result.success) {
          return rpcSuccess(id, {
            ...toolContent(`Error: ${result.error}`),
            isError: true,
          });
        }

        return rpcSuccess(id, toolContent(result.data));
      } catch (err: any) {
        return rpcError(id, -32603, 'Internal error', err.message);
      }
    }

    // ─── Notifications (fire-and-forget) ─────
    case 'notifications/initialized':
      return null; // GoClaw gửi sau initialize, không cần trả lời

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export default router;
