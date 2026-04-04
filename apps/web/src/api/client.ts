import axios from 'axios';
import type { Task, Expense, Client, DashboardSummary, LoginResponse } from '../types';

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

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
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
  return data;
};

export const createTask = async (task: Partial<Task>): Promise<Task> => {
  const { data } = await api.post('/tasks', task);
  return data;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const { data } = await api.put(`/tasks/${id}`, updates);
  return data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const getExpenses = async (filters?: {
  status?: string;
  company_id?: string;
}): Promise<Expense[]> => {
  const { data } = await api.get('/expenses', { params: filters });
  return data;
};

export const createExpense = async (expense: Partial<Expense>): Promise<Expense> => {
  const { data } = await api.post('/expenses', expense);
  return data;
};

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
  const { data } = await api.put(`/expenses/${id}`, updates);
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
  return data;
};

export const createClient = async (client: Partial<Client>): Promise<Client> => {
  const { data } = await api.post('/clients', client);
  return data;
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
  const { data } = await api.put(`/clients/${id}`, updates);
  return data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

export default api;
