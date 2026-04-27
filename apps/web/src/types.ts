export interface User {
  id: string;
  username?: string;
  email: string;
  name?: string;
  role?: string;
  company_id?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  project_id?: string;
  company_id?: string;
  assigned_to?: string;
  due_date?: string;
  has_clarification?: boolean;
  clarification_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  category_id?: string;
  account_id?: string;
  user_id?: string;
  amount: number;
  description?: string;
  date: string;
  type?: string;
  status?: string;
  attachment_url?: string;
  category?: string;
  account?: string;
  user?: User;
  created_at: string;
  updated_at?: string;
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
  company_id?: string;
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

export interface LoginResponse {
  token: string;
  user: User;
}

export type AuthResponse = LoginResponse;

export interface Company {
  id: string;
  name: string;
  logo?: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  client_id: string;
  client?: Client;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST';
  source: string;
  score: number;
  assigned_to: string;
  assignee?: User;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export type AgentStatus = 'online' | 'sleeping' | 'offline';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  capabilities: string[];
  status: AgentStatus;
  active_tasks: number;
  completed_today: number;
  tokens_used: number;
  last_heartbeat: string;
  company_id: string;
}

export interface Clarification {
  id: string;
  agent_id: string;
  agent?: Agent;
  task_id: string;
  task?: Task;
  question: string;
  context: string;
  answer?: string;
  priority: 'low' | 'medium' | 'high';
  answered_at?: string;
  created_at: string;
  company_id: string;
}

export interface Notebook {
  id: string;
  title: string;
  content: string;
  type: 'knowledge' | 'meeting' | 'research' | 'other';
  project_id?: string;
  agent_id?: string;
  created_by: string;
  creator?: User;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  client_id?: string;
  task_id?: string;
  agent_id?: string;
  client?: Client;
  task?: Task;
  agent?: Agent;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  user?: User;
  content: string;
  type: 'text' | 'system';
  created_at: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
