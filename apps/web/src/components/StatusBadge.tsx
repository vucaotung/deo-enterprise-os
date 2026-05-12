import { Badge } from './Badge';
import type {
  AgentStatus,
  ApprovalStatus,
  GoalStatus,
  IssueStatus,
  ProjectStatus,
} from '@/types';

type AnyStatus =
  | IssueStatus
  | GoalStatus
  | ProjectStatus
  | ApprovalStatus
  | AgentStatus;

const VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  // issues
  backlog: 'default',
  todo: 'default',
  in_progress: 'info',
  in_review: 'warning',
  blocked: 'error',
  done: 'success',
  cancelled: 'default',
  // goals + projects
  planned: 'default',
  active: 'info',
  achieved: 'success',
  completed: 'success',
  // approvals
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  revision_requested: 'info',
  // agents
  pending_approval: 'warning',
  paused: 'warning',
  terminated: 'default',
  error: 'error',
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const v = VARIANT[status] ?? 'default';
  return <Badge variant={v}>{status.replace(/_/g, ' ')}</Badge>;
}
