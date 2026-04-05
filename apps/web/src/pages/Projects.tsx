import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FolderKanban, Plus, Search } from 'lucide-react';
import type { Project, ProjectStatus } from '@/types';
import { getProjects } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatDate } from '@/lib/utils';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockProjects: Project[] = [
  {
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
  {
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
  {
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
];

const statusLabelMap: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusVariantMap: Record<ProjectStatus, 'info' | 'warning' | 'success' | 'danger' | 'gray'> = {
  planning: 'warning',
  active: 'info',
  on_hold: 'gray',
  completed: 'success',
  cancelled: 'danger',
};

export const Projects = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPageTitle('Projects');
  }, [setPageTitle]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const data = await getProjects();
        if (data.length > 0) {
          setProjects(data);
        }
      } catch (error) {
        console.warn('Falling back to mock projects', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const keyword = searchQuery.trim().toLowerCase();
      const matchesKeyword =
        keyword.length === 0 ||
        project.name.toLowerCase().includes(keyword) ||
        project.code?.toLowerCase().includes(keyword) ||
        project.description?.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [projects, searchQuery, statusFilter]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => project.status === 'active').length;
  const totalOpenClarifications = projects.reduce((sum, project) => sum + (project.open_clarifications || 0), 0);
  const totalInProgressTasks = projects.reduce((sum, project) => sum + (project.task_summary?.in_progress || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Tổng project</p>
            <p className="text-2xl font-bold text-slate-900">{totalProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Project active</p>
            <p className="text-2xl font-bold text-cyan-600">{activeProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Task đang chạy</p>
            <p className="text-2xl font-bold text-amber-600">{totalInProgressTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Clarification mở</p>
            <p className="text-2xl font-bold text-rose-600">{totalOpenClarifications}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Project Hub</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Lớp quản trị project, dùng để điều hướng task execution theo từng ngữ cảnh.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors">
              <Plus size={16} />
              Tạo project
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="relative w-full lg:max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, code, mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deo-accent focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Đang tải projects...</h3>
              <p className="text-sm text-slate-600 mt-2">Dẹo đang thử lấy runtime data từ API.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <FolderKanban size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">Chưa có project phù hợp</h3>
              <p className="text-sm text-slate-600 mt-2">
                Tạo project đầu tiên hoặc đổi bộ lọc để xem task theo từng ngữ cảnh project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-cyan-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                        {project.code && (
                          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                            {project.code}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
                    </div>
                    <Badge variant={statusVariantMap[project.status]} size="sm">
                      {statusLabelMap[project.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-slate-500">Owner</p>
                      <p className="font-medium text-slate-900">{project.owner?.username || 'Chưa gán'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Due date</p>
                      <p className="font-medium text-slate-900">{project.due_date ? formatDate(project.due_date) : 'Chưa có'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Client</p>
                      <p className="font-medium text-slate-900">{project.client?.name || 'Nội bộ'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Priority</p>
                      <p className="font-medium text-slate-900 capitalize">{project.priority}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold text-slate-900">{project.progress_percent || 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-deo-accent rounded-full"
                        style={{ width: `${project.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">Todo</p>
                      <p className="font-semibold text-slate-900">{project.task_summary?.todo || 0}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">In progress</p>
                      <p className="font-semibold text-slate-900">{project.task_summary?.in_progress || 0}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">Completed</p>
                      <p className="font-semibold text-slate-900">{project.task_summary?.completed || 0}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-slate-500">Clarifications</p>
                      <p className="font-semibold text-slate-900">{project.open_clarifications || 0}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
