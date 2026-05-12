// Thin Paperclip API client. Same-origin (Vite proxy in dev, reverse proxy
// in prod) so better-auth cookies authenticate every call — no token handling
// required in the React app.
//
// Endpoint reference: docs/PAPERCLIP_API.md.

import type {
  Agent,
  Approval,
  ApprovalStatus,
  Company,
  DashboardSnapshot,
  Goal,
  HeartbeatRun,
  Issue,
  IssueComment,
  IssueStatus,
  Project,
} from '@/types';

const BASE = '/api';

class PaperclipError extends Error {
  constructor(public status: number, public details?: unknown, message?: string) {
    super(message || `Paperclip API error ${status}`);
    this.name = 'PaperclipError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (res.status === 401) {
    window.location.assign(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    throw new PaperclipError(401, undefined, 'Not authenticated');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new PaperclipError(res.status, body, body?.error ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Unwrap shapes that vary by endpoint. Paperclip routes sometimes return
// `{ data: T }` and sometimes raw `T`; this normalises both.
function unwrap<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload && Object.keys(payload).length <= 2) {
    return payload.data as T;
  }
  return payload as T;
}

export const paperclip = {
  // Companies
  listCompanies: () =>
    request<unknown>('/companies').then((r) => unwrap<Company[]>(r)),
  getCompany: (id: string) =>
    request<unknown>(`/companies/${id}`).then((r) => unwrap<Company>(r)),
  getDashboard: (companyId: string) =>
    request<unknown>(`/companies/${companyId}/dashboard`).then((r) =>
      unwrap<DashboardSnapshot>(r),
    ),

  // Goals
  listGoals: (companyId: string) =>
    request<unknown>(`/companies/${companyId}/goals`).then((r) => unwrap<Goal[]>(r)),
  getGoal: (id: string) =>
    request<unknown>(`/goals/${id}`).then((r) => unwrap<Goal>(r)),

  // Projects
  listProjects: (companyId: string) =>
    request<unknown>(`/companies/${companyId}/projects`).then((r) =>
      unwrap<Project[]>(r),
    ),
  getProject: (id: string) =>
    request<unknown>(`/projects/${id}`).then((r) => unwrap<Project>(r)),

  // Issues
  listIssues: (
    companyId: string,
    params: { projectId?: string; status?: IssueStatus; search?: string } = {},
  ) => {
    const q = new URLSearchParams();
    if (params.projectId) q.set('projectId', params.projectId);
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    const qs = q.toString();
    return request<unknown>(
      `/companies/${companyId}/issues${qs ? `?${qs}` : ''}`,
    ).then((r) => unwrap<Issue[]>(r));
  },
  getIssue: (id: string) =>
    request<unknown>(`/issues/${id}`).then((r) => unwrap<Issue>(r)),

  listIssueComments: (issueId: string) =>
    request<unknown>(`/issues/${issueId}/comments`).then((r) =>
      unwrap<IssueComment[]>(r),
    ),
  postIssueComment: (
    issueId: string,
    body: { body: string; mentions?: string[] },
  ) =>
    request<unknown>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => unwrap<IssueComment>(r)),

  listIssueRuns: (issueId: string) =>
    request<unknown>(`/issues/${issueId}/runs`).then((r) =>
      unwrap<HeartbeatRun[]>(r),
    ),
  getActiveRun: (issueId: string) =>
    request<unknown>(`/issues/${issueId}/active-run`).then((r) =>
      unwrap<HeartbeatRun | null>(r),
    ),

  patchIssue: (issueId: string, patch: Partial<Issue> & { commentBody?: string }) =>
    request<unknown>(`/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then((r) => unwrap<Issue>(r)),

  // Approvals
  listApprovals: (companyId: string, status?: ApprovalStatus) => {
    const q = status ? `?status=${status}` : '';
    return request<unknown>(`/companies/${companyId}/approvals${q}`).then((r) =>
      unwrap<Approval[]>(r),
    );
  },
  getApproval: (id: string) =>
    request<unknown>(`/approvals/${id}`).then((r) => unwrap<Approval>(r)),
  approveApproval: (id: string, note?: string) =>
    request<unknown>(`/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }).then((r) => unwrap<Approval>(r)),
  rejectApproval: (id: string, note?: string) =>
    request<unknown>(`/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }).then((r) => unwrap<Approval>(r)),
  requestApprovalRevision: (id: string, note: string) =>
    request<unknown>(`/approvals/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }).then((r) => unwrap<Approval>(r)),

  // Agents
  listAgents: (companyId: string) =>
    request<unknown>(`/companies/${companyId}/agents`).then((r) =>
      unwrap<Agent[]>(r),
    ),
  getAgent: (id: string) =>
    request<unknown>(`/agents/${id}`).then((r) => unwrap<Agent>(r)),
  pauseAgent: (id: string) =>
    request<unknown>(`/agents/${id}/pause`, { method: 'POST' }),
  resumeAgent: (id: string) =>
    request<unknown>(`/agents/${id}/resume`, { method: 'POST' }),
  wakeAgent: (id: string, context?: Record<string, unknown>) =>
    request<unknown>(`/agents/${id}/wakeup`, {
      method: 'POST',
      body: JSON.stringify({ context: context ?? {} }),
    }),
};

export { PaperclipError };
