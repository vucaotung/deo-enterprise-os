/**
 * MCP Server — Enterprise OS exposes tools cho GoClaw
 *
 * GoClaw gọi:
 *   GET  /mcp/tools  → danh sách tools
 *   POST /mcp/call   → execute tool
 *
 * Auth: X-Service-Token header hoặc Bearer token (xem service-auth middleware)
 */

import { Router, Response } from 'express';
import { serviceAuthMiddleware, ServiceRequest } from '../middleware/service-auth';
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

router.use(serviceAuthMiddleware);

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
        description: { type: 'string', description: 'Mô tả chi tiết' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        assigned_to_user_id: { type: 'string', description: 'UUID user được assign' },
        project_id: { type: 'string', description: 'UUID project liên quan' },
        due_date: { type: 'string', format: 'date-time', description: 'Deadline (ISO 8601)' },
        context: { type: 'object', description: 'Metadata tùy ý đính kèm task' },
        agent_id: { type: 'string', description: 'Tên hoặc UUID agent tạo task' },
      },
    },
  },
  {
    name: 'eos_query_tasks',
    description: 'Truy vấn danh sách tasks theo filter. Dùng để kiểm tra trạng thái công việc.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'cancelled', 'blocked'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        assigned_to: { type: 'string', description: 'UUID hoặc tên user' },
        project_id: { type: 'string' },
        limit: { type: 'number', default: 20, maximum: 50 },
        offset: { type: 'number', default: 0 },
      },
    },
  },
  {
    name: 'eos_update_task_status',
    description: 'Cập nhật trạng thái task. Dùng khi agent hoàn thành hoặc chuyển giao công việc.',
    inputSchema: {
      type: 'object',
      required: ['task_id', 'status'],
      properties: {
        task_id: { type: 'string', description: 'UUID task' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'cancelled', 'blocked'] },
        progress_percentage: { type: 'number', minimum: 0, maximum: 100 },
        note: { type: 'string', description: 'Ghi chú cập nhật' },
      },
    },
  },
  {
    name: 'eos_get_dashboard_summary',
    description: 'Lấy tóm tắt KPI của hệ thống: tasks, expenses, clients. Dùng cho daily briefing.',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: { type: 'string', enum: ['today', 'week', 'month'], default: 'month' },
      },
    },
  },
  {
    name: 'eos_log_agent_action',
    description: 'Ghi nhật ký hành động của agent vào audit trail. Gọi trước/sau mỗi thao tác quan trọng.',
    inputSchema: {
      type: 'object',
      required: ['agent_id', 'action_type'],
      properties: {
        agent_id: { type: 'string', description: 'Tên agent (vd: deo, hr-agent)' },
        action_type: { type: 'string', description: 'Loại hành động (vd: task_created, email_sent)' },
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
        data: { type: 'object' },
        channel: { type: 'string', description: 'Kênh thực hiện (telegram, zalo, web)' },
      },
    },
  },
  {
    name: 'eos_create_clarification',
    description: 'Tạo yêu cầu làm rõ gửi đến người dùng. Dùng khi agent cần thêm thông tin để tiếp tục.',
    inputSchema: {
      type: 'object',
      required: ['question'],
      properties: {
        task_id: { type: 'string', description: 'Task liên quan (nếu có)' },
        agent_id: { type: 'string' },
        question: { type: 'string', description: 'Câu hỏi cần làm rõ' },
        assigned_to_user_id: { type: 'string' },
        channel: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
        blocks_execution: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'eos_query_clients',
    description: 'Tìm kiếm khách hàng trong CRM. Dùng khi cần thông tin liên hệ hoặc lịch sử giao dịch.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Tìm theo tên, công ty, hoặc email' },
        limit: { type: 'number', default: 10, maximum: 30 },
      },
    },
  },
  {
    name: 'eos_register_drive_artifact',
    description: 'Đăng ký file Google Drive vào hệ thống. Dùng sau khi tạo tài liệu trên Drive.',
    inputSchema: {
      type: 'object',
      required: ['drive_file_id', 'drive_url', 'title'],
      properties: {
        drive_file_id: { type: 'string' },
        drive_url: { type: 'string' },
        title: { type: 'string' },
        entity_type: { type: 'string', description: 'task | project | client' },
        entity_id: { type: 'string' },
        agent_id: { type: 'string' },
      },
    },
  },
];

// ──────────────────────────────────────────────
// GET /mcp/tools
// ──────────────────────────────────────────────

router.get('/tools', (req: ServiceRequest, res: Response) => {
  res.json({ tools: TOOLS });
});

// ──────────────────────────────────────────────
// POST /mcp/call
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

router.post('/call', async (req: ServiceRequest & CorrelatedRequest, res: Response) => {
  const { tool, arguments: args } = req.body;

  if (!tool) {
    return res.status(400).json({ error: 'Missing required field: tool' });
  }

  const handler = TOOL_HANDLERS[tool];
  if (!handler) {
    return res.status(404).json({
      error: `Unknown tool: ${tool}`,
      available_tools: Object.keys(TOOL_HANDLERS),
    });
  }

  try {
    const result = await handler({ ...args, correlation_id: req.correlationId });

    if (!result.success) {
      return res.status(422).json({ error: result.error });
    }

    return res.json({
      tool,
      result: result.data,
      correlation_id: req.correlationId,
    });
  } catch (error: any) {
    console.error(`[MCP] Tool ${tool} failed:`, error);
    return res.status(500).json({ error: 'Tool execution failed', message: error.message });
  }
});

// ──────────────────────────────────────────────
// GET /mcp/health
// ──────────────────────────────────────────────

router.get('/health', (req: ServiceRequest, res: Response) => {
  res.json({
    status: 'ok',
    service: 'deo-enterprise-os-mcp',
    tools_count: TOOLS.length,
    timestamp: new Date().toISOString(),
  });
});

export default router;
