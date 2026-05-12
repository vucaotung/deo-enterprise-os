// Paperclip API response shapes used by the Worker Console.
// Mirrors docs/PAPERCLIP_API.md and paperclip/packages/shared/src/constants.ts.

export type IssueStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'done'
  | 'cancelled';

export type GoalLevel = 'company' | 'team' | 'agent' | 'task';
export type GoalStatus = 'planned' | 'active' | 'achieved' | 'cancelled';

export type ProjectStatus =
  | 'backlog'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ApprovalType =
  | 'hire_agent'
  | 'approve_ceo_strategy'
  | 'budget_override_required'
  | 'request_board_approval';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type AgentStatus =
  | 'pending_approval'
  | 'active'
  | 'paused'
  | 'terminated'
  | 'error';

export type ActorType = 'user' | 'agent' | 'system';

export interface Company {
  id: string;
  name: string;
  shortname?: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  companyId: string;
  title: string;
  description?: string | null;
  level: GoalLevel;
  status: GoalStatus;
  parentId?: string | null;
  ownerAgentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  companyId: string;
  shortname?: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  goalIds: string[];
  leadAgentId?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  companyId: string;
  projectId?: string | null;
  parentId?: string | null;
  shortname?: string;
  title: string;
  description?: string | null;
  status: IssueStatus;
  assignedAgentId?: string | null;
  labels?: string[];
  priority?: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorType: ActorType;
  authorId: string;
  authorDisplay?: string;
  body: string;
  mentions?: string[];
  createdAt: string;
}

export interface HeartbeatRun {
  id: string;
  agentId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  startedAt?: string | null;
  finishedAt?: string | null;
  issueIds: string[];
}

export interface ActivityEntry {
  id: string | number;
  companyId: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  agentId?: string | null;
  runId?: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface Approval {
  id: string;
  companyId: string;
  type: ApprovalType;
  status: ApprovalStatus;
  proposerAgentId?: string | null;
  payload: Record<string, unknown>;
  linkedIssueIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  companyId: string;
  name: string;
  role?: string | null;
  status: AgentStatus;
  adapterType: string;
  managerId?: string | null;
  reportIds?: string[];
  lastHeartbeatAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSnapshot {
  agents: { active: number; running: number; paused: number; error: number };
  tasks: { open: number; inProgress: number; blocked: number; completed: number };
  costs: { monthSpend: number; monthBudget: number; utilization: number };
  budgets: { activeIncidents: number; pendingApprovals: number; pausedResources: number };
}

export type LiveEventType =
  | 'heartbeat.run.queued'
  | 'heartbeat.run.status'
  | 'heartbeat.run.event'
  | 'heartbeat.run.log'
  | 'agent.status'
  | 'activity.logged'
  | 'plugin.ui.updated'
  | 'plugin.worker.crashed'
  | 'plugin.worker.restarted';

export interface LiveEvent<P = Record<string, unknown>> {
  id: number;
  companyId: string;
  type: LiveEventType;
  createdAt: string;
  payload: P;
}
