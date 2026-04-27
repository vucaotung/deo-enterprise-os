import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CircleAlert, ClipboardList, NotebookText, UserRound } from 'lucide-react';
import type { Project } from '@/types';
import { getProject } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatDate } from '@/lib/utils';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockProjects: Record<string, Project> = {
  p1: {
    id: 'p1',
    company_id: 'c1',
    client_id: 'cl1',
    owner_id: 'u1',
    name: 'Triển khai Enterprise OS v1',
    code: 'EOS-001',
    description: 'Chuẩn hóa web app, API và orchestration foundation cho bản vận hành đầu tiên.',
    status: 'active',
    priority: 'high',
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress_percent: 62,
    open_clarifications: 3,
    task_summary: { total: 18, todo: 5, in_progress: 6, completed: 6, cancelled: 1 },
    client: { id: 'cl1', name: 'Nội bộ Dẹo OS', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    owner: { id: 'u1', username: 'vincent_vtung', email: 'vincent@example.com' },
  },
  p2: {
    id: 'p2',
    company_id: 'c1',
    owner_id: 'u1',
    name: 'Project Finance Hub Cleanup',
    code: 'FIN-002',
    description: 'Dọn finance hub theo canonical direction trước khi nối reporting thật.',
    status: 'planning',
    priority: 'medium',
    start_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress_percent: 15,
    open_clarifications: 1,
    task_summary: { total: 9, todo: 6, in_progress: 1, completed: 2, cancelled: 0 },
    owner: { id: 'u1', username: 'vincent_vtung', email: 'vincent@example.com' },
  },
  p3: {
    id: 'p3',
    company_id: 'c1',
    owner_id: 'u2',
    name: 'CRM Workflow Restructure',
    code: 'CRM-003',
    description: 'Tách CRM hub và client/lead flow để chuẩn hóa route và state.',
    status: 'on_hold',
    priority: 'high',
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress_percent: 28,
    open_clarifications: 4,
    task_summary: { total: 12, todo: 4, in_progress: 3, completed: 4, cancelled: 1 },
    owner: { id: 'u2', username: 'operator_1', email: 'operator1@example.com' },
  },
};

const mockTaskRows: Record<string, Array<{ id: string; title: string; status: string; assignee: string; dueDate: string }>> = {
  p1: [
    { id: 't1', title: 'Canonicalize auth flow', status: 'in_progress', assignee: 'vincent_vtung', dueDate: new Date(Date.now() + 86400000).toISOString() },
    { id: 't2', title: 'Stabilize task route schema', status: 'todo', assignee: 'operator_1', dueDate: new Date(Date.now() + 172800000).toISOString() },
    { id: 't3', title: 'Wire project hub into app shell', status: 'completed', assignee: 'vincent_vtung', dueDate: new Date(Date.now() - 86400000).toISOString() },
  ],
  p2: [
    { id: 't4', title: 'Review finance mock states', status: 'todo', assignee: 'vincent_vtung', dueDate: new Date(Date.now() + 259200000).toISOString() },
    { id: 't5', title: 'Map finance cards to canonical sections', status: 'planning', assignee: 'vincent_vtung', dueDate: new Date(Date.now() + 345600000).toISOString() },
  ],
  p3: [
    { id: 't6', title: 'Split CRM hub from lead detail flow', status: 'in_progress', assignee: 'operator_1', dueDate: new Date(Date.now() + 86400000 * 4).toISOString() },
    { id: 't7', title: 'Audit client status language', status: 'todo', assignee: 'operator_2', dueDate: new Date(Date.now() + 86400000 * 6).toISOString() },
  ],
};

const mockClarifications: Record<string, Array<{ id: string; title: string; status: string }>> = {
  p1: [
    { id: 'c1', title: 'API client canonical path còn split?', status: 'open' },
    { id: 'c2', title: 'Project detail nên đi tab hay sub-routes?', status: 'open' },
    { id: 'c3', title: 'Tasks page sẽ share component nào với project tasks?', status: 'pending' },
  ],
  p2: [{ id: 'c4', title: 'Finance summary cards ưu tiên metric nào?', status: 'open' }],
  p3: [
    { id: 'c5', title: 'CRM hub giữ 1 page hay tách clients/leads?', status: 'open' },
    { id: 'c6', title: 'Client lifecycle labels nên unify ra sao?', status: 'resolved' },
  ],
};

const mockNotebooks: Record<string, Array<{ id: string; title: string; type: string; updatedAt: string }>> = {
  p1: [
    { id: 'n1', title: 'Architecture baseline notes', type: 'spec', updatedAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'n2', title: 'Web canonicalization checklist', type: 'decision', updatedAt: new Date(Date.now() - 43200000).toISOString() },
  ],
  p2: [{ id: 'n3', title: 'Finance domain sketch', type: 'research', updatedAt: new Date(Date.now() - 172800000).toISOString() }],
  p3: [{ id: 'n4', title: 'CRM route restructure draft', type: 'meeting_note', updatedAt: new Date(Date.now() - 259200000).toISOString() }],
};

const statusVariantMap: Record<Project['status'], 'info' | 'warning' | 'success' | 'error' | 'default'> = {
  planning: 'warning',
  active: 'info',
  on_hold: 'default',
  completed: 'success',
  cancelled: 'error',
};

const statusLabelMap: Record<Project['status'], string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ProjectDetail = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setPageTitle(project ? project.name : 'Project detail');
  }, [project, setPageTitle]);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;

      try {
        const data = await getProject(id);
        setProject(data);
        setUsingFallback(false);
      } catch (error) {
        console.warn('Falling back to mock project detail', error);
        setProject(mockProjects[id]);
        setUsingFallback(true);
      }
    };

    loadProject();
  }, [id]);

  if (!project) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Quay lại project hub
        </button>
        <Card>
          <CardContent>
            <div className="py-10 text-center">
              <h2 className="text-xl font-semibold text-slate-900">Không tìm thấy project</h2>
              <p className="text-sm text-slate-600 mt-2">Project này chưa có trong shell hiện tại hoặc ID chưa đúng.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskRows = mockTaskRows[project.id] || [];
  const clarifications = mockClarifications[project.id] || [];
  const notebooks = mockNotebooks[project.id] || [];

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Đang dùng fallback project detail vì API detail chưa phản hồi đúng lúc này.
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={16} />
            Quay lại project hub
          </button>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {project.code && (
              <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                {project.code}
              </span>
            )}
            <Badge variant={statusVariantMap[project.status]} size="sm">
              {statusLabelMap[project.status]}
            </Badge>
          </div>

          <p className="text-slate-600 max-w-3xl">{project.description}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/projects/${project.id}/tasks`)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ClipboardList size={16} />
            Xem task view theo project
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg text-sm font-medium hover:bg-cyan-600">
            Cập nhật project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Progress</p>
            <p className="text-2xl font-bold text-slate-900">{project.progress_percent || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Task total</p>
            <p className="text-2xl font-bold text-cyan-600">{project.task_summary?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Clarification mở</p>
            <p className="text-2xl font-bold text-rose-600">{project.open_clarifications || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Priority</p>
            <p className="text-2xl font-bold text-amber-600 capitalize">{project.priority}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-600">
                  <UserRound size={16} />
                  <span className="text-sm">Owner</span>
                </div>
                <p className="font-semibold text-slate-900">{project.owner?.username || 'Chưa gán'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-600">
                  <Calendar size={16} />
                  <span className="text-sm">Due date</span>
                </div>
                <p className="font-semibold text-slate-900">{project.due_date ? formatDate(project.due_date) : 'Chưa có'}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Tiến độ tổng thể</span>
                <span className="font-semibold text-slate-900">{project.progress_percent || 0}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-deo-accent rounded-full" style={{ width: `${project.progress_percent || 0}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Todo</p>
                <p className="text-xl font-semibold text-slate-900">{project.task_summary?.todo || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-500">In progress</p>
                <p className="text-xl font-semibold text-slate-900">{project.task_summary?.in_progress || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-xl font-semibold text-slate-900">{project.task_summary?.completed || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Cancelled</p>
                <p className="text-xl font-semibold text-slate-900">{project.task_summary?.cancelled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500 mb-1">Client / context</p>
                <p className="font-semibold text-slate-900">{project.client?.name || 'Nội bộ / internal project'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500 mb-1">Start date</p>
                <p className="font-semibold text-slate-900">{project.start_date ? formatDate(project.start_date) : 'Chưa có'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500 mb-1">Open clarifications</p>
                <p className="font-semibold text-slate-900">{clarifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Task snapshot</CardTitle>
              <button
                type="button"
                onClick={() => navigate(`/projects/${project.id}/tasks`)}
                className="text-sm font-medium text-deo-accent hover:underline"
              >
                Mở task view
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taskRows.map((task) => (
                <div key={task.id} className="rounded-xl border border-slate-200 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">Assignee: {task.assignee}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700">{task.status}</span>
                    <span className="text-slate-500">Due: {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clarifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clarifications.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start gap-2">
                    <CircleAlert size={16} className="text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-1">Status: {item.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Linked notebooks</CardTitle>
            <span className="text-sm font-medium text-slate-500 inline-flex items-center gap-1">
              <NotebookText size={16} />
              Project notebooks sẽ mở ở Phase D
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {notebooks.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500 mt-2">Type: {item.type}</p>
                <p className="text-sm text-slate-500 mt-1">Updated: {formatDate(item.updatedAt)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
