import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query as dbQuery } from '../db';

type JsonObject = Record<string, any>;

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonObject;
}

interface ToolSpec {
  definition: McpToolDefinition;
  schema: z.ZodTypeAny;
  handler: (args: any) => Promise<any>;
}

const workflowStatusExpr = `COALESCE(workflow_status,
  CASE
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'in_progress' THEN 'in_progress'
    WHEN status IN ('failed', 'cancelled') THEN 'cancelled'
    ELSE 'todo'
  END
)`;

const projectTaskWorkflowExpr = `COALESCE(t.workflow_status,
  CASE
    WHEN t.status = 'completed' THEN 'completed'
    WHEN t.status = 'in_progress' THEN 'in_progress'
    WHEN t.status IN ('failed', 'cancelled') THEN 'cancelled'
    ELSE 'todo'
  END
)`;

const optionalString = z.string().min(1).optional();

function objectSchema(properties: JsonObject, required: string[] = []) {
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

function normalizeStatus(status?: string) {
  switch (status) {
    case 'todo':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return status;
    case 'open':
    case 'assigned':
    case 'review':
      return 'todo';
    case 'failed':
      return 'cancelled';
    default:
      return undefined;
  }
}

function isOptionalDbShapeError(error: any) {
  return ['42P01', '42703', '23502'].includes(error?.code);
}

async function firstValue(sql: string, params: any[] = []) {
  const result = await dbQuery(sql, params);
  const row = result.rows[0];
  return row ? Object.values(row)[0] : undefined;
}

async function resolveCompanyId(args: JsonObject) {
  if (args.company_id) {
    return args.company_id;
  }
  if (process.env.ENTERPRISE_OS_MCP_COMPANY_ID) {
    return process.env.ENTERPRISE_OS_MCP_COMPANY_ID;
  }

  for (const sql of [
    'SELECT id FROM deo.companies ORDER BY created_at ASC LIMIT 1',
    'SELECT company_id FROM deo.users ORDER BY created_at ASC LIMIT 1',
    'SELECT company_id FROM deo.projects ORDER BY created_at ASC LIMIT 1',
    'SELECT company_id FROM deo.tasks ORDER BY created_at ASC LIMIT 1',
  ]) {
    try {
      const value = await firstValue(sql);
      if (value) {
        return value as string;
      }
    } catch (error: any) {
      if (!isOptionalDbShapeError(error)) {
        throw error;
      }
    }
  }

  throw new Error('Unable to resolve company_id; set ENTERPRISE_OS_MCP_COMPANY_ID or pass company_id');
}

async function resolveActorId(args: JsonObject, companyId: string) {
  if (args.actor_id) {
    return args.actor_id;
  }
  if (args.user_id) {
    return args.user_id;
  }
  if (process.env.ENTERPRISE_OS_MCP_ACTOR_ID) {
    return process.env.ENTERPRISE_OS_MCP_ACTOR_ID;
  }

  try {
    const value = await firstValue('SELECT id FROM deo.users WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1', [companyId]);
    if (value) {
      return value as string;
    }
  } catch (error: any) {
    if (!isOptionalDbShapeError(error)) {
      throw error;
    }
  }

  return 'mcp-service';
}

async function logAgentAction(args: {
  action_type: string;
  actor_id?: string;
  entity_type: string;
  entity_id: string;
  metadata?: JsonObject;
  company_id?: string;
}) {
  const companyId = await resolveCompanyId(args);
  const actorId = await resolveActorId(args, companyId);
  const auditId = uuidv4();

  await dbQuery(
    `INSERT INTO deo.audit_events (id, company_id, user_id, action, entity_type, entity_id, new_values, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [auditId, companyId, actorId, args.action_type, args.entity_type, args.entity_id, args.metadata ? JSON.stringify(args.metadata) : null]
  );

  return { id: auditId, company_id: companyId, actor_id: actorId, logged: true };
}

async function auditFallback(actionType: string, args: JsonObject, entityType: string, entityId: string, reason: string) {
  const result = await logAgentAction({
    action_type: actionType,
    actor_id: args.actor_id || args.user_id,
    entity_type: entityType,
    entity_id: entityId,
    metadata: { ...args, fallback: true, reason },
    company_id: args.company_id,
  });

  return { ...result, persisted: false, fallback: true, reason };
}

async function createTask(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const actorId = await resolveActorId(args, companyId);
  const taskId = uuidv4();

  await dbQuery(
    `INSERT INTO deo.tasks (id, company_id, project_id, title, description, status, workflow_status, priority, created_by, assigned_to, due_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
    [
      taskId,
      companyId,
      args.project_id || null,
      args.title,
      args.description || null,
      'todo',
      'todo',
      args.priority || 'medium',
      actorId,
      args.assignee || args.assigned_to || null,
      args.due_date || null,
    ]
  );

  await logAgentAction({
    action_type: 'mcp.create_task',
    actor_id: actorId,
    entity_type: 'task',
    entity_id: taskId,
    metadata: {
      source: args.source,
      source_channel: args.source_channel,
      source_message_id: args.source_message_id,
    },
    company_id: companyId,
  });

  const result = await dbQuery(`SELECT *, ${workflowStatusExpr} AS workflow_status_normalized FROM deo.tasks WHERE id = $1`, [taskId]);
  return result.rows[0];
}

async function queryTasks(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const limit = Math.min(Number(args.limit) || 20, 100);
  const params: any[] = [companyId];
  let sql = `SELECT *, ${workflowStatusExpr} AS workflow_status_normalized FROM deo.tasks WHERE company_id = $1`;

  if (args.project_id) {
    sql += ` AND project_id = $${params.length + 1}`;
    params.push(args.project_id);
  }

  const status = normalizeStatus(args.status);
  if (status) {
    sql += ` AND ${workflowStatusExpr} = $${params.length + 1}`;
    params.push(status);
  }

  if (args.assignee) {
    sql += ` AND assigned_to = $${params.length + 1}`;
    params.push(args.assignee);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await dbQuery(sql, params);
  return { data: result.rows, total: result.rows.length };
}

async function updateTaskStatus(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const status = normalizeStatus(args.status);
  if (!status) {
    throw new Error(`Unsupported task status: ${args.status}`);
  }

  const result = await dbQuery(
    `UPDATE deo.tasks SET status = $1, workflow_status = $2, updated_at = NOW()
     WHERE id = $3 AND company_id = $4 RETURNING *`,
    [status, status, args.task_id, companyId]
  );

  if (result.rows.length === 0) {
    throw new Error('Task not found');
  }

  await logAgentAction({
    action_type: 'mcp.update_task_status',
    actor_id: args.actor_id,
    entity_type: 'task',
    entity_id: args.task_id,
    metadata: { status },
    company_id: companyId,
  });

  return result.rows[0];
}

async function addTaskComment(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const actorId = await resolveActorId(args, companyId);
  const commentId = uuidv4();

  try {
    const result = await dbQuery(
      `INSERT INTO deo.task_comments (id, company_id, task_id, content, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [commentId, companyId, args.task_id, args.content, actorId]
    );
    return result.rows[0];
  } catch (error: any) {
    if (!isOptionalDbShapeError(error)) {
      throw error;
    }
    return auditFallback('mcp.add_task_comment', { ...args, actor_id: actorId, company_id: companyId }, 'task', args.task_id, error.message);
  }
}

async function listProjects(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const limit = Math.min(Number(args.limit) || 100, 200);
  const params: any[] = [companyId];
  let whereClause = 'WHERE p.company_id = $1';

  if (args.status) {
    whereClause += ` AND p.status = $${params.length + 1}`;
    params.push(args.status);
  }

  const sql = `
    SELECT
      p.*,
      c.name AS client_name,
      COALESCE(task_stats.total_tasks, 0) AS total_tasks,
      COALESCE(task_stats.todo_tasks, 0) AS todo_tasks,
      COALESCE(task_stats.in_progress_tasks, 0) AS in_progress_tasks,
      COALESCE(task_stats.completed_tasks, 0) AS completed_tasks,
      COALESCE(task_stats.cancelled_tasks, 0) AS cancelled_tasks,
      COALESCE(task_stats.progress_percent, 0) AS progress_percent
    FROM deo.projects p
    LEFT JOIN deo.clients c ON c.id = p.client_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_tasks,
        COALESCE(ROUND(AVG(CASE WHEN ${projectTaskWorkflowExpr} = 'completed' THEN 100 ELSE 0 END)), 0) AS progress_percent
      FROM deo.tasks t
      WHERE t.project_id = p.id
    ) task_stats ON true
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const result = await dbQuery(sql, params);
  return { data: result.rows, total: result.rows.length };
}

async function queryProject(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const result = await dbQuery(
    `
    SELECT
      p.*,
      c.name AS client_name,
      COALESCE(task_stats.total_tasks, 0) AS total_tasks,
      COALESCE(task_stats.todo_tasks, 0) AS todo_tasks,
      COALESCE(task_stats.in_progress_tasks, 0) AS in_progress_tasks,
      COALESCE(task_stats.completed_tasks, 0) AS completed_tasks,
      COALESCE(task_stats.cancelled_tasks, 0) AS cancelled_tasks,
      COALESCE(task_stats.progress_percent, 0) AS progress_percent
    FROM deo.projects p
    LEFT JOIN deo.clients c ON c.id = p.client_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN ${projectTaskWorkflowExpr} = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_tasks,
        COALESCE(ROUND(AVG(CASE WHEN ${projectTaskWorkflowExpr} = 'completed' THEN 100 ELSE 0 END)), 0) AS progress_percent
      FROM deo.tasks t
      WHERE t.project_id = p.id
    ) task_stats ON true
    WHERE p.id = $1 AND p.company_id = $2
    `,
    [args.project_id, companyId]
  );

  if (result.rows.length === 0) {
    throw new Error('Project not found');
  }

  return result.rows[0];
}

async function getDashboardSummary(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const [tasksResult, expensesResult, leadsResult, agentsResult, clarificationsResult] = await Promise.all([
    dbQuery(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN status IN ('open', 'todo') THEN 1 ELSE 0 END) as open,
              SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
       FROM deo.tasks WHERE company_id = $1`,
      [companyId]
    ),
    dbQuery(
      `SELECT SUM(CAST(amount AS BIGINT)) as total, COUNT(*) as count,
              SUM(CASE WHEN status = 'approved' THEN CAST(amount AS BIGINT) ELSE 0 END) as approved
       FROM deo.expenses WHERE company_id = $1`,
      [companyId]
    ),
    dbQuery(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
       FROM deo.leads WHERE company_id = $1`,
      [companyId]
    ),
    dbQuery(
      `SELECT COUNT(*) as online FROM deo.agents WHERE company_id = $1 AND status = 'online'`,
      [companyId]
    ),
    dbQuery(
      `SELECT COUNT(*) as total FROM deo.clarifications WHERE company_id = $1 AND status = 'pending'`,
      [companyId]
    ),
  ]);

  const tasksData = tasksResult.rows[0];
  const expensesData = expensesResult.rows[0];
  const leadsData = leadsResult.rows[0];
  const agentsData = agentsResult.rows[0];
  const clarificationsData = clarificationsResult.rows[0];

  return {
    company_id: companyId,
    tasks: {
      total: parseInt(tasksData.total) || 0,
      completed: parseInt(tasksData.completed) || 0,
      open: parseInt(tasksData.open) || 0,
      in_progress: parseInt(tasksData.in_progress) || 0,
    },
    expenses: {
      total: parseInt(expensesData.total) || 0,
      count: parseInt(expensesData.count) || 0,
      approved: parseInt(expensesData.approved) || 0,
    },
    leads: {
      total: parseInt(leadsData.total) || 0,
      converted: parseInt(leadsData.converted) || 0,
    },
    agents: {
      online: parseInt(agentsData.online) || 0,
    },
    clarifications: {
      pending: parseInt(clarificationsData.total) || 0,
    },
  };
}

async function createReminder(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const reminderId = uuidv4();

  try {
    const result = await dbQuery(
      `INSERT INTO deo.reminders (id, company_id, entity_type, entity_id, message, due_at, user_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW()) RETURNING *`,
      [reminderId, companyId, args.entity_type, args.entity_id, args.message, args.due_at, args.user_id || null]
    );
    return result.rows[0];
  } catch (error: any) {
    if (!isOptionalDbShapeError(error)) {
      throw error;
    }
    return auditFallback('mcp.create_reminder', { ...args, company_id: companyId }, args.entity_type, args.entity_id, error.message);
  }
}

async function registerDriveArtifact(args: JsonObject) {
  const companyId = await resolveCompanyId(args);
  const artifactId = uuidv4();

  try {
    const result = await dbQuery(
      `INSERT INTO deo.drive_artifacts (id, company_id, file_id, file_name, artifact_type, source_entity_id, source_thread_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [
        artifactId,
        companyId,
        args.file_id,
        args.file_name,
        args.artifact_type,
        args.source_entity_id || null,
        args.source_thread_id || null,
        JSON.stringify(args.metadata || {}),
      ]
    );
    return result.rows[0];
  } catch (error: any) {
    if (!isOptionalDbShapeError(error)) {
      throw error;
    }
    return auditFallback('mcp.register_drive_artifact', { ...args, company_id: companyId }, 'drive_artifact', args.file_id, error.message);
  }
}

const toolSpecs: ToolSpec[] = [
  {
    definition: {
      name: 'eos_create_task',
      description: 'Create an Enterprise OS task.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        project_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        assignee: { type: 'string' },
        due_date: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        source: { type: 'string' },
        source_channel: { type: 'string' },
        source_message_id: { type: 'string' },
        actor_id: { type: 'string' },
      }, ['title']),
    },
    schema: z.object({
      company_id: optionalString,
      project_id: optionalString,
      title: z.string().min(1),
      description: optionalString,
      assignee: optionalString,
      due_date: optionalString,
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      source: optionalString,
      source_channel: optionalString,
      source_message_id: optionalString,
      actor_id: optionalString,
    }),
    handler: createTask,
  },
  {
    definition: {
      name: 'eos_query_tasks',
      description: 'Query Enterprise OS tasks.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        project_id: { type: 'string' },
        status: { type: 'string' },
        assignee: { type: 'string' },
        limit: { type: 'number' },
      }),
    },
    schema: z.object({
      company_id: optionalString,
      project_id: optionalString,
      status: optionalString,
      assignee: optionalString,
      limit: z.number().int().positive().max(100).optional(),
    }),
    handler: queryTasks,
  },
  {
    definition: {
      name: 'eos_update_task_status',
      description: 'Update task workflow status.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        task_id: { type: 'string' },
        status: { type: 'string' },
        actor_id: { type: 'string' },
      }, ['task_id', 'status', 'actor_id']),
    },
    schema: z.object({
      company_id: optionalString,
      task_id: z.string().min(1),
      status: z.string().min(1),
      actor_id: z.string().min(1),
    }),
    handler: updateTaskStatus,
  },
  {
    definition: {
      name: 'eos_add_task_comment',
      description: 'Add a comment to a task.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        task_id: { type: 'string' },
        content: { type: 'string' },
        actor_id: { type: 'string' },
      }, ['task_id', 'content', 'actor_id']),
    },
    schema: z.object({
      company_id: optionalString,
      task_id: z.string().min(1),
      content: z.string().min(1),
      actor_id: z.string().min(1),
    }),
    handler: addTaskComment,
  },
  {
    definition: {
      name: 'eos_list_projects',
      description: 'List Enterprise OS projects.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        status: { type: 'string' },
        limit: { type: 'number' },
      }),
    },
    schema: z.object({
      company_id: optionalString,
      status: optionalString,
      limit: z.number().int().positive().max(200).optional(),
    }),
    handler: listProjects,
  },
  {
    definition: {
      name: 'eos_query_project',
      description: 'Get one Enterprise OS project with task summary.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        project_id: { type: 'string' },
      }, ['project_id']),
    },
    schema: z.object({
      company_id: optionalString,
      project_id: z.string().min(1),
    }),
    handler: queryProject,
  },
  {
    definition: {
      name: 'eos_get_dashboard_summary',
      description: 'Get dashboard summary for a company.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
      }, ['company_id']),
    },
    schema: z.object({
      company_id: z.string().min(1),
    }),
    handler: getDashboardSummary,
  },
  {
    definition: {
      name: 'eos_create_reminder',
      description: 'Create a reminder or audit fallback when reminders table is unavailable.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
        message: { type: 'string' },
        due_at: { type: 'string' },
        user_id: { type: 'string' },
      }, ['entity_type', 'entity_id', 'message', 'due_at', 'user_id']),
    },
    schema: z.object({
      company_id: optionalString,
      entity_type: z.string().min(1),
      entity_id: z.string().min(1),
      message: z.string().min(1),
      due_at: z.string().min(1),
      user_id: z.string().min(1),
    }),
    handler: createReminder,
  },
  {
    definition: {
      name: 'eos_register_drive_artifact',
      description: 'Register a Google Drive artifact or audit fallback when drive_artifacts table is unavailable.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        file_id: { type: 'string' },
        file_name: { type: 'string' },
        artifact_type: { type: 'string' },
        source_entity_id: { type: 'string' },
        source_thread_id: { type: 'string' },
        metadata: { type: 'object' },
      }, ['file_id', 'file_name', 'artifact_type']),
    },
    schema: z.object({
      company_id: optionalString,
      file_id: z.string().min(1),
      file_name: z.string().min(1),
      artifact_type: z.string().min(1),
      source_entity_id: optionalString,
      source_thread_id: optionalString,
      metadata: z.record(z.any()).optional(),
    }),
    handler: registerDriveArtifact,
  },
  {
    definition: {
      name: 'eos_log_agent_action',
      description: 'Write an agent action to Enterprise OS audit events.',
      inputSchema: objectSchema({
        company_id: { type: 'string' },
        action_type: { type: 'string' },
        actor_id: { type: 'string' },
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
        metadata: { type: 'object' },
      }, ['action_type', 'actor_id', 'entity_type', 'entity_id']),
    },
    schema: z.object({
      company_id: optionalString,
      action_type: z.string().min(1),
      actor_id: z.string().min(1),
      entity_type: z.string().min(1),
      entity_id: z.string().min(1),
      metadata: z.record(z.any()).optional(),
    }),
    handler: logAgentAction,
  },
];

export const mcpTools = toolSpecs.map((tool) => tool.definition);

export async function callMcpTool(name: string, args: JsonObject = {}) {
  const tool = toolSpecs.find((item) => item.definition.name === name);
  if (!tool) {
    throw new Error(`Unknown MCP tool: ${name}`);
  }

  const parsed = tool.schema.parse(args);
  return tool.handler(parsed);
}
