import { query as dbQuery } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface McpToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ──────────────────────────────────────────────
// TASK TOOLS
// ──────────────────────────────────────────────

export async function eos_create_task(args: {
  title: string;
  description?: string;
  priority?: string;
  assigned_to_user_id?: string;
  project_id?: string;
  due_date?: string;
  context?: Record<string, any>;
  agent_id?: string;
  correlation_id?: string;
}): Promise<McpToolResult> {
  try {
    const id = uuidv4();
    const priority = args.priority || 'medium';
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return { success: false, error: `Invalid priority: ${priority}. Must be one of ${validPriorities.join(', ')}` };
    }

    const agentRow = args.agent_id
      ? (await dbQuery('SELECT id FROM deo.agents WHERE name = $1 OR id::text = $1', [args.agent_id])).rows[0]
      : null;

    await dbQuery(
      `INSERT INTO deo.tasks
         (id, title, description, status, workflow_status, execution_status, priority,
          assigned_to, project_id, due_date, agent_id, context, created_at, updated_at)
       VALUES ($1,$2,$3,'todo','todo','idle',$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
      [
        id,
        args.title,
        args.description || null,
        priority,
        args.assigned_to_user_id || null,
        args.project_id || null,
        args.due_date || null,
        agentRow?.id || null,
        JSON.stringify({ ...args.context, _correlation_id: args.correlation_id }),
      ]
    );

    const result = await dbQuery('SELECT id, title, status, priority, created_at FROM deo.tasks WHERE id = $1', [id]);
    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eos_query_tasks(args: {
  status?: string;
  priority?: string;
  assigned_to?: string;
  project_id?: string;
  limit?: number;
  offset?: number;
}): Promise<McpToolResult> {
  try {
    const limit = Math.min(args.limit || 20, 50);
    const offset = args.offset || 0;
    const conditions: string[] = [];
    const params: any[] = [];

    if (args.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(args.status);
    }
    if (args.priority) {
      conditions.push(`priority = $${params.length + 1}`);
      params.push(args.priority);
    }
    if (args.assigned_to) {
      conditions.push(`assigned_to::text = $${params.length + 1}`);
      params.push(args.assigned_to);
    }
    if (args.project_id) {
      conditions.push(`project_id::text = $${params.length + 1}`);
      params.push(args.project_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await dbQuery(
      `SELECT id, title, description, status, priority, assigned_to, project_id, due_date, created_at, updated_at
       FROM deo.tasks ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { success: true, data: { tasks: result.rows, count: result.rows.length } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eos_update_task_status(args: {
  task_id: string;
  status: string;
  progress_percentage?: number;
  note?: string;
  correlation_id?: string;
}): Promise<McpToolResult> {
  try {
    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'cancelled', 'blocked'];
    if (!validStatuses.includes(args.status)) {
      return { success: false, error: `Invalid status: ${args.status}. Must be one of ${validStatuses.join(', ')}` };
    }

    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [args.status];

    if (args.progress_percentage !== undefined) {
      updates.push(`progress_percentage = $${params.length + 1}`);
      params.push(Math.min(100, Math.max(0, args.progress_percentage)));
    }

    params.push(args.task_id);
    const result = await dbQuery(
      `UPDATE deo.tasks SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING id, title, status, progress_percentage`,
      params
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Task not found' };
    }

    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ──────────────────────────────────────────────
// DASHBOARD TOOL
// ──────────────────────────────────────────────

export async function eos_get_dashboard_summary(args: {
  date_range?: string;
}): Promise<McpToolResult> {
  try {
    const [taskStats, expenseStats, clientStats] = await Promise.all([
      dbQuery(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled')) AS active_tasks,
          COUNT(*) FILTER (WHERE status = 'done') AS done_tasks,
          COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('done','cancelled')) AS urgent_tasks,
          COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('done','cancelled')) AS overdue_tasks
        FROM deo.tasks
      `),
      dbQuery(`
        SELECT
          COALESCE(SUM(amount), 0) AS total_expenses_this_month,
          COUNT(*) AS expense_count
        FROM deo.expenses
        WHERE created_at >= date_trunc('month', NOW())
      `),
      dbQuery(`SELECT COUNT(*) AS total_clients FROM deo.clients WHERE is_active = true`),
    ]);

    return {
      success: true,
      data: {
        tasks: taskStats.rows[0],
        expenses: expenseStats.rows[0],
        clients: clientStats.rows[0],
        generated_at: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ──────────────────────────────────────────────
// AUDIT / LOGGING TOOL
// ──────────────────────────────────────────────

export async function eos_log_agent_action(args: {
  agent_id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  data?: Record<string, any>;
  correlation_id?: string;
  channel?: string;
}): Promise<McpToolResult> {
  try {
    const id = uuidv4();
    await dbQuery(
      `INSERT INTO deo.audit_events
         (id, event_type, actor_type, actor_id, entity_type, entity_id, data, channel, created_at)
       VALUES ($1,$2,'agent',$3,$4,$5,$6,$7,NOW())`,
      [
        id,
        args.action_type,
        args.agent_id,
        args.entity_type || null,
        args.entity_id || null,
        JSON.stringify({ ...args.data, _correlation_id: args.correlation_id }),
        args.channel || null,
      ]
    );
    return { success: true, data: { audit_event_id: id } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ──────────────────────────────────────────────
// CLARIFICATION TOOL
// ──────────────────────────────────────────────

export async function eos_create_clarification(args: {
  task_id?: string;
  agent_id?: string;
  question: string;
  assigned_to_user_id?: string;
  channel?: string;
  priority?: string;
  blocks_execution?: boolean;
  correlation_id?: string;
}): Promise<McpToolResult> {
  try {
    const id = uuidv4();

    const agentRow = args.agent_id
      ? (await dbQuery('SELECT id FROM deo.agents WHERE name = $1 OR id::text = $1', [args.agent_id])).rows[0]
      : null;

    await dbQuery(
      `INSERT INTO deo.clarifications
         (id, task_id, agent_id, assigned_to, question, status, channel, priority, blocks_execution, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'open',$6,$7,$8,NOW(),NOW())`,
      [
        id,
        args.task_id || null,
        agentRow?.id || null,
        args.assigned_to_user_id || null,
        args.question,
        args.channel || 'system',
        args.priority || 'normal',
        args.blocks_execution !== false,
      ]
    );

    const result = await dbQuery('SELECT id, question, status, created_at FROM deo.clarifications WHERE id = $1', [id]);
    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ──────────────────────────────────────────────
// CRM TOOL
// ──────────────────────────────────────────────

export async function eos_query_clients(args: {
  search?: string;
  limit?: number;
}): Promise<McpToolResult> {
  try {
    const limit = Math.min(args.limit || 10, 30);
    const params: any[] = [];

    let where = 'WHERE is_active = true';
    if (args.search) {
      params.push(`%${args.search}%`);
      where += ` AND (name ILIKE $1 OR company ILIKE $1 OR email ILIKE $1)`;
    }
    params.push(limit);

    const result = await dbQuery(
      `SELECT id, name, company, email, phone, tags FROM deo.clients ${where} ORDER BY name LIMIT $${params.length}`,
      params
    );

    return { success: true, data: { clients: result.rows, count: result.rows.length } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ──────────────────────────────────────────────
// GOOGLE DRIVE ARTIFACT TOOL
// ──────────────────────────────────────────────

export async function eos_register_drive_artifact(args: {
  drive_file_id: string;
  drive_url: string;
  title: string;
  entity_type?: string;
  entity_id?: string;
  agent_id?: string;
  correlation_id?: string;
}): Promise<McpToolResult> {
  try {
    await eos_log_agent_action({
      agent_id: args.agent_id || 'system',
      action_type: 'drive_artifact_registered',
      entity_type: args.entity_type,
      entity_id: args.entity_id,
      data: {
        drive_file_id: args.drive_file_id,
        drive_url: args.drive_url,
        title: args.title,
      },
      correlation_id: args.correlation_id,
      channel: 'gdrive',
    });

    return {
      success: true,
      data: {
        registered: true,
        drive_file_id: args.drive_file_id,
        title: args.title,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
