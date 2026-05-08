import axios from 'axios';
import type {
  Task,
  Expense,
  Client,
  DashboardSummary,
  LoginResponse,
  Project,
  Agent,
  TaskExecutionListRow,
  AgentJob,
  AgentJobQueueState,
} from '../types';

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
  project_name: task.project_name || task.project?.name || undefined,
  assigned_to: task.assigned_to ? String(task.assigned_to) : undefined,
  assignee_name: task.assignee_name || task.assignee?.name || task.agent_display_name || undefined,
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
  assigned_to?: string;
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

const agentEmoji = (name?: string): string => {
  const key = (name || '').toLowerCase();
  if (key.includes('it') || key.includes('dev') || key.includes('code')) return '💻';
  if (key.includes('finance') || key.includes('kế toán')) return '💰';
  if (key.includes('hr')) return '👥';
  if (key.includes('office')) return '🏢';
  if (key.includes('phap') || key.includes('luật')) return '⚖️';
  return '🤖';
};

const normalizeAgent = (agent: any): Agent => ({
  id: String(agent.id),
  name: agent.display_name || agent.name,
  emoji: agent.metadata?.emoji || agentEmoji(agent.name || agent.display_name),
  capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : [],
  status: agent.status === 'online' ? 'online' : agent.status === 'sleeping' ? 'sleeping' : 'offline',
  active_tasks: Number(agent.active_tasks || 0),
  completed_today: Number(agent.completed_today || 0),
  tokens_used: Number(agent.tokens_used || 0),
  last_heartbeat: agent.last_heartbeat || agent.updated_at || agent.created_at || new Date(0).toISOString(),
  company_id: String(agent.company_id || ''),
});

export const getAgents = async (filters?: { status?: string }): Promise<Agent[]> => {
  const { data } = await api.get('/agents', { params: filters });
  return unwrapList<any>(data).map(normalizeAgent);
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
// Task executions + agent jobs (PR3 orchestration UI)
// ============================================================

export const getTask = async (id: string): Promise<Task> => {
  const { data } = await api.get(`/tasks/${id}`);
  return normalizeTask(data);
};

export const getTaskExecutions = async (taskId: string): Promise<TaskExecutionListRow[]> => {
  const { data } = await api.get(`/tasks/${taskId}/executions`);
  return unwrapList<TaskExecutionListRow>(data);
};

export const createTaskExecution = async (
  taskId: string,
  body: { runtime_type?: string; agent_id?: string; input?: Record<string, unknown>; trigger_reason?: string } = {}
): Promise<{ execution: TaskExecutionListRow; agentJob: AgentJob }> => {
  const { data } = await api.post(`/tasks/${taskId}/executions`, body);
  return data;
};

export const getAgentJob = async (id: string): Promise<AgentJob> => {
  const { data } = await api.get(`/agent-jobs/${id}`);
  return data;
};

export const patchAgentJobStatus = async (
  id: string,
  body: { queue_state?: AgentJobQueueState; output?: unknown; error?: unknown }
): Promise<AgentJob> => {
  const { data } = await api.patch(`/agent-jobs/${id}/status`, body);
  return data;
};

export const retryAgentJob = async (
  id: string
): Promise<{ execution: TaskExecutionListRow; agentJob: AgentJob }> => {
  const { data } = await api.post(`/agent-jobs/${id}/retry`);
  return data;
};

export const cancelAgentJob = async (id: string): Promise<AgentJob> =>
  patchAgentJobStatus(id, { queue_state: 'cancelled' });

export default api;
