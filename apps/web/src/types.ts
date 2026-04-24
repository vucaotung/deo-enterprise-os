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
  assigned_to?: string;
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
  alerts?: Array<{ type: string; message: string }>;
}

export interface Worker {
  id: string;
  company_id: string;
  user_id?: string;
  agent_id?: string;
  worker_type: 'human' | 'ai';
  display_name: string;
  email?: string;
  avatar_url?: string;
  role_name?: string;
  status: string;
  active_tasks?: number;
  completed_tasks?: number;
  roles?: string[];
  projects?: Array<{
    project_id: string;
    project_name: string;
    project_code: string;
    membership_role: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface Approval {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_title?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  requested_by: string;
  assigned_to: string;
  project_id?: string;
  company_id?: string;
  decision_note?: string;
  decided_at?: string;
  due_at?: string;
  metadata?: Record<string, unknown>;
  requester?: { id: string; display_name: string; worker_type: string };
  assignee?: { id: string; display_name: string; worker_type: string };
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actor_type: string;
  actor_id: string;
  actor_name?: string;
  actor_avatar?: string;
  entity_type: string;
  entity_id: string;
  project_id?: string;
  company_id?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PMDashboard {
  kpis: {
    active_projects: number;
    total_tasks: number;
    open_tasks: number;
    overdue_tasks: number;
    pending_approvals: number;
    running_agents: number;
    completion_rate: number;
  };
  recent_activity: ActivityLog[];
  tasks_by_status: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  projects_by_status: Record<string, number>;
  overdue_tasks: any[];
  upcoming_deadlines: any[];
}

export interface DashboardCharts {
  expense_by_category: Array<{ category: string; amount: number }>;
  task_status: Array<{ status: string; count: number }>;
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface LoginResponse {
  token: string;
  user: User;
}
