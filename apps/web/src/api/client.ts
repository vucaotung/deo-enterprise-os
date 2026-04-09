import axios from 'axios';
import type { Task, Expense, Client, DashboardSummary, LoginResponse, Project, Worker, Approval, PMDashboard } from '../types';

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
    },
  };
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

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

// ============================================================
// PM Module API functions
// ============================================================

export const getPMDashboard = async (): Promise<PMDashboard> => {
  const { data } = await api.get('/pm/dashboard');
  return data;
};

export const getWorkers = async (filters?: {
  worker_type?: string;
  status?: string;
  search?: string;
}): Promise<Worker[]> => {
  const { data } = await api.get('/workers', { params: filters });
  return unwrapList<Worker>(data);
};

export const getWorker = async (id: string): Promise<Worker> => {
  const { data } = await api.get(`/workers/${id}`);
  return data;
};

export const getApprovals = async (filters?: {
  status?: string;
  assigned_to?: string;
  project_id?: string;
}): Promise<Approval[]> => {
  const { data } = await api.get('/approvals', { params: filters });
  return unwrapList<Approval>(data);
};

export const createApproval = async (approval: Partial<Approval>): Promise<Approval> => {
  const { data } = await api.post('/approvals', approval);
  return data;
};

export const decideApproval = async (
  id: string,
  decision: { status: 'approved' | 'rejected'; decision_note?: string }
): Promise<Approval> => {
  const { data } = await api.post(`/approvals/${id}/decide`, decision);
  return data;
};

export const getActivity = async (filters?: {
  project_id?: string;
  entity_type?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; pagination: any }> => {
  const { data } = await api.get('/activity', { params: filters });
  return data;
};

export const createProject = async (project: Partial<Project>): Promise<Project> => {
  const { data } = await api.post('/projects', project);
  return normalizeProject(data);
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const { data } = await api.patch(`/projects/${id}`, updates);
  return normalizeProject(data);
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const getProjectMembers = async (projectId: string): Promise<any[]> => {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return unwrapList(data);
};

export const addProjectMember = async (projectId: string, body: { worker_id: string; membership_role?: string }): Promise<any> => {
  const { data } = await api.post(`/projects/${projectId}/members`, body);
  return data;
};

export const removeProjectMember = async (projectId: string, memberId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}/members/${memberId}`);
};

export const getProjectTasks = async (projectId: string, filters?: { status?: string }): Promise<Task[]> => {
  const { data } = await api.get(`/projects/${projectId}/tasks`, { params: filters });
  return unwrapList<any>(data).map(normalizeTask);
};

export default api;
