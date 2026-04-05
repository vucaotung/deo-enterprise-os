import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ListFilter, Plus, Rows3, SquareKanban } from 'lucide-react';
import type { Project, Task } from '@/types';
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

const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Canonicalize auth flow',
    description: 'Chốt auth shell, route guard và login flow về cùng một ngôn ngữ.',
    status: 'in_progress',
    priority: 'high',
    project_id: 'p1',
    assigned_to: 'vincent_vtung',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't2',
    title: 'Stabilize task route schema',
    description: 'Dọn API/task routes cho đúng schema runtime và type layer.',
    status: 'todo',
    priority: 'medium',
    project_id: 'p1',
    assigned_to: 'operator_1',
    due_date: new Date(Date.now() + 172800000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't3',
    title: 'Wire project hub into app shell',
    description: 'Thêm route, sidebar và page shell cho domain project.',
    status: 'completed',
    priority: 'high',
    project_id: 'p1',
    assigned_to: 'vincent_vtung',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't4',
    title: 'Review finance mock states',
    description: 'Xác định debt còn lại trong finance hub trước khi cleanup.',
    status: 'todo',
    priority: 'medium',
    project_id: 'p2',
    assigned_to: 'vincent_vtung',
    due_date: new Date(Date.now() + 259200000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't5',
    title: 'Map finance cards to canonical sections',
    description: 'Chia finance hub thành sections đúng domain.',
    status: 'cancelled',
    priority: 'low',
    project_id: 'p2',
    assigned_to: 'vincent_vtung',
    due_date: new Date(Date.now() + 345600000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't6',
    title: 'Split CRM hub from lead detail flow',
    description: 'Tách layer hub và detail để CRM route không ôm quá nhiều state.',
    status: 'in_progress',
    priority: 'high',
    project_id: 'p3',
    assigned_to: 'operator_1',
    due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't7',
    title: 'Audit client lifecycle language',
    description: 'Đồng bộ labels/trạng thái giữa CRM hub và client detail.',
    status: 'todo',
    priority: 'medium',
    project_id: 'p3',
    assigned_to: 'operator_2',
    due_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const statusLabelMap: Record<Task['status'], string> = {
  todo: 'To do',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusVariantMap: Record<Task['status'], 'warning' | 'info' | 'success' | 'error'> = {
  todo: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};

const priorityVariantMap: Record<NonNullable<Task['priority']>, 'default' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
};

export const ProjectTasks = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const { id } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');

  const project = id ? mockProjects[id] : undefined;

  useEffect(() => {
    setPageTitle(project ? `${project.name} · Tasks` : 'Project tasks');
  }, [project, setPageTitle]);

  const projectTasks = useMemo(() => {
    const rows = mockTasks.filter((task) => task.project_id === id);
    if (statusFilter === 'all') return rows;
    return rows.filter((task) => task.status === statusFilter);
  }, [id, statusFilter]);

  const groupedTasks = useMemo(() => {
    return {
      todo: projectTasks.filter((task) => task.status === 'todo'),
      in_progress: projectTasks.filter((task) => task.status === 'in_progress'),
      completed: projectTasks.filter((task) => task.status === 'completed'),
      cancelled: projectTasks.filter((task) => task.status === 'cancelled'),
    };
  }, [projectTasks]);

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
              <p className="text-sm text-slate-600 mt-2">Project này chưa có trong mock shell hiện tại.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={16} />
            Quay lại project detail
          </button>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Project tasks · {project.name}</h1>
          <p className="text-slate-600 max-w-3xl">
            Task execution view theo ngữ cảnh project. Đây là lớp nối trực tiếp giữa Project Management và Task Management.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg text-sm font-medium hover:bg-cyan-600">
          <Plus size={16} />
          Tạo task trong project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Tổng task</p>
            <p className="text-2xl font-bold text-slate-900">{projectTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Todo</p>
            <p className="text-2xl font-bold text-amber-600">{groupedTasks.todo.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">In progress</p>
            <p className="text-2xl font-bold text-cyan-600">{groupedTasks.in_progress.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Completed</p>
            <p className="text-2xl font-bold text-green-600">{groupedTasks.completed.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Task view</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Cùng một task language với canonical model: `todo`, `in_progress`, `completed`, `cancelled`.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Rows3 size={16} />
                  List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <SquareKanban size={16} />
                  Kanban
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ListFilter size={16} className="text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | Task['status'])}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deo-accent focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projectTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Chưa có task nào</h3>
              <p className="text-sm text-slate-600 mt-2">Tạo task đầu tiên để project này có execution layer thật.</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Task</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Assignee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{task.assigned_to || 'Chưa gán'}</td>
                      <td className="px-4 py-4">
                        {task.priority ? <Badge variant={priorityVariantMap[task.priority]}>{task.priority}</Badge> : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariantMap[task.status]}>{statusLabelMap[task.status]}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{task.due_date ? formatDate(task.due_date) : 'Chưa có'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              {(['todo', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
                <div key={status} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">{statusLabelMap[status]}</h3>
                    <Badge variant={statusVariantMap[status]}>{groupedTasks[status].length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {groupedTasks[status].length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                        Không có task.
                      </div>
                    ) : (
                      groupedTasks[status].map((task) => (
                        <div key={task.id} className="rounded-lg bg-white border border-slate-200 p-4 shadow-sm">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          {task.description && <p className="text-sm text-slate-500 mt-2">{task.description}</p>}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {task.priority && <Badge variant={priorityVariantMap[task.priority]}>{task.priority}</Badge>}
                            <Badge variant="default">{task.assigned_to || 'Chưa gán'}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-3">Due: {task.due_date ? formatDate(task.due_date) : 'Chưa có'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
