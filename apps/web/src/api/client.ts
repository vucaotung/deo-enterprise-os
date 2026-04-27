import axios from 'axios';
import type { Task, Expense, Client, DashboardSummary, LoginResponse, Project } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unwrapList = <T>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
};

const normalizeProjectStatus = (status?: string): Project['status'] => {
  switch (status) {
    case 'planning':
      return 'planning';
    case 'active':
      return 'active';
    case 'paused':
    case 'on_hold':
      return 'on_hold';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'planning';
  }
};

const normalizeProject = (project: any): Project => ({
  id: String(project.id),
  company_id: String(project.company_id ?? ''),
  client_id: project.client_id ? String(project.client_id) : undefined,
  owner_id: project.created_by ? String(project.created_by) : undefined,
  name: project.name,
  code: project.code || undefined,
  description: project.description || undefined,
  status: normalizeProjectStatus(project.status),
  priority: project.priority || 'medium',
  start_date: project.start_date || undefined,
  due_date: project.end_date || project.due_date || undefined,
  completed_at: project.completed_at || undefined,
  created_at: project.created_at,
  updated_at: project.updated_at,
  progress_percent: Number(project.progress_percent || 0),
  open_clarifications: Number(project.open_clarifications || 0),
  task_summary: {
    total: Number(project.total_tasks || 0),
    todo: Number(project.todo_tasks || 0),
    in_progress: Number(project.in_progress_tasks || 0),
    completed: Number(project.completed_tasks || 0),
    cancelled: Number(project.cancelled_tasks || 0),
  },
  client: project.client_name
    ? {
        id: String(project.client_id || ''),
        name: project.client_name,
        status: 'active',
        created_at: project.created_at,
        updated_at: project.updated_at,
      }
    : undefined,
});

const normalizeTaskStatus = (status?: string): Task['status'] => {
  switch (status) {
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'cancelled';
    case 'open':
    case 'assigned':
    case 'review':
    case 'todo':
    default:
      return 'todo';
  }
};

const normalizeTask = (task: any): Task => ({
  id: String(task.id),
  title: task.title,
  description: task.description || undefined,
  status: normalizeTaskStatus(task.workflow_status || task.status),
  priority: task.priority === 'urgent' ? 'high' : task.priority || 'medium',
  project_id: task.project_id ? String(task.project_id) : undefined,
  assigned_to: task.assigned_to ? String(task.assigned_to) : undefined,
  due_date: task.due_date || undefined,
  created_at: task.created_at,
  updated_at: task.updated_at,
});

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/login', { email: username, password });
  return {
    token: data.token,
    user: {
      id: String(data.user.id),
      username: data.user.full_name || data.user.email,
      email: data.user.email,
      name: data.user.full_name,
      role: data.user.role,
      company_id: data.user.company_id,
    },
  };
};

export interface InvitePreview {
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'staff' | 'agent_handler';
  company_name?: string;
  expires_at: string;
}

export const getInvite = async (code: string): Promise<InvitePreview> => {
  const { data } = await api.get(`/invites/${encodeURIComponent(code)}`);
  return data;
};

export const signup = async (payload: {
  code: string;
  password: string;
  full_name?: string;
}): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/signup', payload);
  return {
    token: data.token,
    user: {
      id: String(data.user.id),
      username: data.user.full_name || data.user.email,
      email: data.user.email,
      name: data.user.full_name,
      role: data.user.role,
      company_id: data.user.company_id,
    },
  };
};

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  company_role: 'admin' | 'manager' | 'staff' | 'agent_handler';
  last_login_at?: string;
  created_at: string;
}

export const listUsers = async (): Promise<AdminUser[]> => {
  const { data } = await api.get('/users');
  return data.users;
};

export const updateUser = async (id: string, patch: Partial<{
  is_active: boolean;
  role: 'admin' | 'manager' | 'staff' | 'agent_handler';
  full_name: string;
  password: string;
}>) => {
  const { data } = await api.patch(`/users/${id}`, patch);
  return data;
};

export const disableUser = async (id: string) => {
  await api.delete(`/users/${id}`);
};

export interface Invite {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'staff' | 'agent_handler';
  created_at: string;
  expires_at: string;
  used_at?: string;
  created_by_email?: string;
}

export const listInvites = async (): Promise<Invite[]> => {
  const { data } = await api.get('/invites');
  return data.invites;
};

export const createInvite = async (payload: {
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'staff' | 'agent_handler';
}): Promise<{ invite: Invite; invite_url: string; email: { delivered: boolean; reason?: string } }> => {
  const { data } = await api.post('/invites', payload);
  return data;
};

export const revokeInvite = async (id: string) => {
  await api.delete(`/invites/${id}`);
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get('/dashboard/summary');
  return data;
};

export const getTasks = async (filters?: {
  company_id?: string;
  project_id?: string;
  status?: string;
  assignee_id?: string;
}): Promise<Task[]> => {
  const { data } = await api.get('/tasks', { params: filters });
  return unwrapList<any>(data).map(normalizeTask);
};

export const createTask = async (task: Partial<Task>): Promise<Task> => {
  const { data } = await api.post('/tasks', task);
  return normalizeTask(data);
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const { data } = await api.patch(`/tasks/${id}`, updates);
  return normalizeTask(data);
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const getProjects = async (filters?: {
  status?: string;
  client_id?: string;
  search?: string;
}): Promise<Project[]> => {
  const { data } = await api.get('/projects', { params: filters });
  return unwrapList<any>(data).map(normalizeProject);
};

export const getProject = async (id: string): Promise<Project> => {
  const { data } = await api.get(`/projects/${id}`);
  return normalizeProject(data);
};

export const getExpenses = async (filters?: {
  status?: string;
  company_id?: string;
}): Promise<Expense[]> => {
  const { data } = await api.get('/expenses', { params: filters });
  return unwrapList<Expense>(data);
};

export const createExpense = async (expense: Partial<Expense>): Promise<Expense> => {
  const { data } = await api.post('/expenses', expense);
  return data;
};

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
  const { data } = await api.patch(`/expenses/${id}`, updates);
  return data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await api.delete(`/expenses/${id}`);
};

export const getClients = async (filters?: {
  status?: string;
  company_id?: string;
}): Promise<Client[]> => {
  const { data } = await api.get('/clients', { params: filters });
  return unwrapList<Client>(data);
};

export const createClient = async (client: Partial<Client>): Promise<Client> => {
  const { data } = await api.post('/clients', client);
  return data;
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
  const { data } = await api.patch(`/clients/${id}`, updates);
  return data;
};

export const getLeads = async (): Promise<any[]> => {
  const { data } = await api.get('/leads');
  return unwrapList(data);
};

export const getNotebooks = async (): Promise<any[]> => {
  const { data } = await api.get('/notebooks');
  return unwrapList(data);
};

export const getClarifications = async (): Promise<any[]> => {
  const { data } = await api.get('/clarifications');
  return unwrapList(data);
};

export const getAgents = async (): Promise<any[]> => {
  const { data } = await api.get('/agents');
  return unwrapList(data);
};

export const getConversations = async (): Promise<any[]> => {
  const { data } = await api.get('/conversations');
  return unwrapList(data);
};

export const getMessages = async (conversationId: string): Promise<any[]> => {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return unwrapList(data);
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

export default api;
