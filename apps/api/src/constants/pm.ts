// ============================================================
// Project Manager — Status Dictionaries & Constants
// Canonical source of truth cho toàn bộ PM module
// ============================================================

// --- Project ---

export const PROJECT_STATUSES = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  AT_RISK: 'at_risk',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

export const PROJECT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type ProjectPriority = (typeof PROJECT_PRIORITIES)[keyof typeof PROJECT_PRIORITIES];

export const PROJECT_HEALTH = {
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  OFF_TRACK: 'off_track',
} as const;

export type ProjectHealth = (typeof PROJECT_HEALTH)[keyof typeof PROJECT_HEALTH];

// --- Task ---

export const TASK_STATUSES = {
  NEW: 'new',
  TRIAGED: 'triaged',
  QUEUED: 'queued',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  WAITING_INFO: 'waiting_info',
  WAITING_APPROVAL: 'waiting_approval',
  BLOCKED: 'blocked',
  DONE: 'done',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[keyof typeof TASK_PRIORITIES];

// --- Approval ---

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[keyof typeof APPROVAL_STATUSES];

// --- Agent Job ---

export const AGENT_JOB_STATUSES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  WAITING_APPROVAL: 'waiting_approval',
  DONE: 'done',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type AgentJobStatus = (typeof AGENT_JOB_STATUSES)[keyof typeof AGENT_JOB_STATUSES];

// --- Worker ---

export const WORKER_TYPES = {
  HUMAN: 'human',
  AI: 'ai',
} as const;

export type WorkerType = (typeof WORKER_TYPES)[keyof typeof WORKER_TYPES];

// --- Project Membership ---

export const MEMBERSHIP_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer',
  APPROVER: 'approver',
} as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[keyof typeof MEMBERSHIP_ROLES];

// --- RBAC Roles ---

export const SYSTEM_ROLES = {
  OWNER_ADMIN: 'owner_admin',
  OPERATIONS_MANAGER: 'operations_manager',
  PROJECT_MANAGER: 'project_manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
  AI_AGENT_SYSTEM: 'ai_agent_system',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

// --- Permissions ---

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  PROJECTS_VIEW: 'projects.view',
  PROJECTS_MANAGE: 'projects.manage',
  TASKS_VIEW: 'tasks.view',
  TASKS_MANAGE: 'tasks.manage',
  TASKS_ASSIGN: 'tasks.assign',
  WORKERS_VIEW: 'workers.view',
  WORKERS_MANAGE: 'workers.manage',
  APPROVALS_VIEW: 'approvals.view',
  APPROVALS_DECIDE: 'approvals.decide',
  AI_JOBS_VIEW: 'ai_jobs.view',
  AI_JOBS_RUN: 'ai_jobs.run',
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_MANAGE: 'documents.manage',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// --- Activity ---

export const ACTIVITY_ACTIONS = {
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_ASSIGNED: 'task_assigned',
  WORKER_ADDED_TO_PROJECT: 'worker_added_to_project',
  APPROVAL_REQUESTED: 'approval_requested',
  APPROVAL_APPROVED: 'approval_approved',
  APPROVAL_REJECTED: 'approval_rejected',
  AGENT_JOB_STARTED: 'agent_job_started',
  AGENT_JOB_FINISHED: 'agent_job_finished',
  AGENT_JOB_FAILED: 'agent_job_failed',
  DOCUMENT_UPLOADED: 'document_uploaded',
  COMMENT_ADDED: 'comment_added',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

// --- Scope ---

export const SCOPE_TYPES = {
  GLOBAL: 'global',
  PROJECT: 'project',
  COMPANY: 'company',
} as const;

export type ScopeType = (typeof SCOPE_TYPES)[keyof typeof SCOPE_TYPES];
