import type {
  User as RuntimeUser,
  Task as RuntimeTask,
  Expense as RuntimeExpense,
  Client as RuntimeClient,
  DashboardSummary as RuntimeDashboardSummary,
  LoginResponse as RuntimeLoginResponse,
} from '../types';

/**
 * Legacy compatibility layer.
 *
 * Canonical target for v0.3.0 is: ../types
 * This file stays temporarily so older imports that resolve to `types/index.ts`
 * can coexist while the frontend type graph is cleaned up.
 */

export type User = RuntimeUser;
export type Task = RuntimeTask;
export type Expense = RuntimeExpense;
export type Client = RuntimeClient;
export type DashboardSummary = RuntimeDashboardSummary;
export type AuthResponse = RuntimeLoginResponse;

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

export interface Project {
  id: string;
  name: string;
  description: string;
  company_id: string;
  status: 'active' | 'inactive' | 'archived';
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
