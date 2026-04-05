import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ListFilter, Plus, Rows3, SquareKanban } from 'lucide-react';
import type { Task } from '@/types';
import { getTasks } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { SlidePanel } from '@/components/SlidePanel';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { formatDate } from '@/lib/utils';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

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

export const Tasks = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setPageTitle('Công việc');
  }, [setPageTitle]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const data = await getTasks();
        setTasks(data);
        setUsingFallback(false);
      } catch (error) {
        console.warn('Falling back to mock tasks', error);
        setTasks(mockTasks);
        setUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  const groupedTasks = useMemo(() => {
    return {
      todo: filteredTasks.filter((task) => task.status === 'todo'),
      in_progress: filteredTasks.filter((task) => task.status === 'in_progress'),
      completed: filteredTasks.filter((task) => task.status === 'completed'),
      cancelled: filteredTasks.filter((task) => task.status === 'cancelled'),
    };
  }, [filteredTasks]);

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((task) => task.status === 'todo').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;

  const handleAddTask = () => {
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Đang dùng fallback task data vì runtime API chưa phản hồi ổn định.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Tổng task</p>
            <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Todo</p>
            <p className="text-2xl font-bold text-amber-600">{todoTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">In progress</p>
            <p className="text-2xl font-bold text-cyan-600">{inProgressTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Global task view</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Toàn bộ task đang dùng chung canonical language với project-scoped task view.
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

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
              >
                <Plus size={16} />
                Thêm công việc
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Đang tải tasks...</h3>
              <p className="text-sm text-slate-600 mt-2">Dẹo đang kéo global task list từ API.</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Không có task phù hợp</h3>
              <p className="text-sm text-slate-600 mt-2">Đổi bộ lọc hoặc tạo task mới để bắt đầu execution layer.</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Task</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Assignee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{task.project_id || 'No project'}</td>
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
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="w-full text-left rounded-lg bg-white border border-slate-200 p-4 shadow-sm hover:border-cyan-300 transition-colors"
                        >
                          <p className="font-medium text-slate-900">{task.title}</p>
                          {task.description && <p className="text-sm text-slate-500 mt-2">{task.description}</p>}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {task.priority && <Badge variant={priorityVariantMap[task.priority]}>{task.priority}</Badge>}
                            <Badge variant="default">{task.assigned_to || 'Chưa gán'}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-3">Due: {task.due_date ? formatDate(task.due_date) : 'Chưa có'}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SlidePanel
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || ''}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Mô tả</h4>
              <p className="text-slate-600">{selectedTask.description || 'Chưa có mô tả.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Ưu tiên</p>
                {selectedTask.priority ? (
                  <Badge variant={priorityVariantMap[selectedTask.priority]}>{selectedTask.priority}</Badge>
                ) : (
                  <p className="text-sm text-slate-900">Chưa có</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Trạng thái</p>
                <Badge variant={statusVariantMap[selectedTask.status]}>{statusLabelMap[selectedTask.status]}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Project</p>
                <p className="text-sm text-slate-900">{selectedTask.project_id || 'No project'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Gán cho</p>
                <p className="text-sm text-slate-900">{selectedTask.assigned_to || 'Chưa gán'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-1">Hạn cuối</p>
              <p className="text-sm text-slate-900">{selectedTask.due_date ? formatDate(selectedTask.due_date) : 'Chưa có'}</p>
            </div>

            <button className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors">
              Chỉnh sửa công việc
            </button>
          </div>
        )}
      </SlidePanel>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tạo công việc mới"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Tiêu đề</label>
            <input
              type="text"
              placeholder="Nhập tiêu đề công việc..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Mô tả</label>
            <textarea
              placeholder="Mô tả chi tiết công việc..."
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <button
            onClick={handleAddTask}
            className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors"
          >
            Tạo công việc
          </button>
        </div>
      </Modal>
    </div>
  );
};
