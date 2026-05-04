export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'agent' | 'user';
  is_active: boolean;
  company_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: string;
  company_id: string;
  account_type: string;
  account_number: string;
  bank_name: string;
  account_holder: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  category_type: 'expense' | 'income' | 'task' | 'project';
  created_at: Date;
  updated_at: Date;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  contact_person?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'prospect';
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  client_id?: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: Date;
  end_date?: Date;
  budget: number;
  spent: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Expense {
  id: string;
  company_id: string;
  project_id?: string;
  category_id?: string;
  account_id?: string;
  amount: number;
  currency: string;
  description: string;
  expense_date: Date;
  receipt_url?: string;
  created_by: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  company_id: string;
  project_id?: string;
  title: string;
  description?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface File {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: Date;
}

export interface Contract {
  id: string;
  company_id: string;
  client_id: string;
  contract_number: string;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  value: number;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  document_url?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Reminder {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  description?: string;
  reminder_date: Date;
  is_completed: boolean;
  entity_type?: string;
  entity_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Quote {
  id: string;
  company_id: string;
  client_id: string;
  quote_number: string;
  items: unknown;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  website?: string;
  logo_url?: string;
  currency: string;
  timezone: string;
  industry?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  source: 'website' | 'referral' | 'campaign' | 'social' | 'cold_outreach' | 'other';
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'lost' | 'converted';
  score: number;
  assigned_to?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Interaction {
  id: string;
  company_id: string;
  lead_id?: string;
  client_id?: string;
  user_id: string;
  interaction_type: 'call' | 'email' | 'meeting' | 'message' | 'note';
  subject: string;
  notes: string;
  duration_minutes?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Agent {
  id: string;
  company_id: string;
  name: string;
  agent_type: string;
  endpoint: string;
  status: 'online' | 'offline' | 'busy' | 'idle';
  last_heartbeat: Date;
  capabilities: string[];
  metadata?: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface Clarification {
  id: string;
  company_id: string;
  conversation_id: string;
  question: string;
  context?: string;
  status: 'pending' | 'answered' | 'resolved';
  answer?: string;
  answered_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notebook {
  id: string;
  company_id: string;
  title: string;
  content: string;
  entity_type?: string;
  entity_id?: string;
  created_by: string;
  is_pinned: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  company_id: string;
  agent_id: string;
  task_id?: string;
  title: string;
  status: 'active' | 'closed' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  attachments?: unknown;
  created_at: Date;
}

export interface AuditEvent {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: unknown;
  new_values?: unknown;
  ip_address?: string;
  created_at: Date;
}

export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    company_id: string;
    role: string;
  };
}
