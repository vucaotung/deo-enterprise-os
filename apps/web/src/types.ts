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
