export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  project_id?: string;
  project_name?: string;
  assigned_to?: string;
  assignee_name?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  category_id: string;
  account_id: string;
  user_id?: string;
  amount: number;
  description?: string;
  date: string;
  type: string;
  status: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  company?: string;
  source?: string;
  status: 'active' | 'inactive';
  owner_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  company_id: string;
  client_id?: string;
  owner_id?: string;
  name: string;
  code?: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  task_summary?: {
    total: number;
    todo: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  open_clarifications?: number;
  progress_percent?: number;
  client?: Client;
  owner?: User;
}

export interface DashboardSummary {
  taskCount: number;
  expenseCount: number;
  clientCount: number;
  taskCountByStatus: Record<string, number>;
  tasks?: {
    total: number;
    completed: number;
    open: number;
    in_progress: number;
  };
  expenses?: {
    total: number;
    count: number;
    approved: number;
  };
  leads?: {
    total: number;
    converted: number;
  };
  agents?: {
    online: number;
    offline: number;
  };
  clarifications?: {
    pending: number;
  };
  alerts?: Array<{ type: string; message: string }>;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  capabilities: string[];
  status: 'online' | 'sleeping' | 'offline';
  active_tasks: number;
  completed_today: number;
  tokens_used: number;
  last_heartbeat: string;
  company_id: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type TaskExecutionStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'needs_review';

export type AgentJobQueueState =
  | 'queued'
  | 'claimed'
  | 'running'
  | 'done'
  | 'dead'
  | 'cancelled';

export interface TaskExecutionListRow {
  id: string;
  task_id: string;
  parent_execution_id?: string | null;
  attempt_number: number;
  status: TaskExecutionStatus;
  trigger_reason?: string | null;
  triggered_by?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
  agent_job_id?: string | null;
  agent_job_queue_state?: AgentJobQueueState | null;
  agent_job_runtime_type?: string | null;
  agent_job_agent_id?: string | null;
  agent_job_tokens_in?: number | null;
  agent_job_tokens_out?: number | null;
  agent_job_cost_usd?: number | null;
}

export interface AgentJob {
  id: string;
  execution_id: string;
  sequence_index: number;
  agent_id?: string | null;
  runtime_type: string;
  queue_name?: string | null;
  queue_state: AgentJobQueueState;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  log_tail?: string | null;
  logs_url?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  cost_usd?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
  task_id?: string;
  task_title?: string;
}
