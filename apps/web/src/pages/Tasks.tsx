import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ListFilter, Plus, Rows3, SquareKanban, Bot } from 'lucide-react';
import type { Task, Agent } from '@/types';
import { createTask, getAgents, getTasks, previewAgent, updateTask } from '@/api/client';
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

const getProjectLabel = (task: Task) => task.project_name || task.project_id || 'No project';
const getAssigneeLabel = (task: Task) => task.assignee_name || task.assigned_to || 'Chưa gán';

export const Tasks = () => {
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date'>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [createForm, setCreateForm] = useState<{
    title: string;
    description: string;
    tagsInput: string;
    overrideAgentId: string;
  }>({ title: '', description: '', tagsInput: '', overrideAgentId: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [suggestedAgent, setSuggestedAgent] = useState<{ name: string; reason: string } | null>(null);

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

  useEffect(() => {
    if (!showAddModal) return;
    let cancelled = false;
    getAgents().then((rows) => {
      if (!cancelled) setAgentList(rows);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [showAddModal]);

  useEffect(() => {
    if (!showAddModal) return;
    const tagList = createForm.tagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (tagList.length === 0) {
      setSuggestedAgent(null);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const result = await previewAgent(tagList);
        if (cancelled) return;
        setSuggestedAgent(
          result.picked
            ? { name: result.picked.display_name || result.picked.name, reason: result.picked.reason }
            : null
        );
      } catch {
        if (!cancelled) setSuggestedAgent(null);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [createForm.tagsInput, showAddModal]);

  const resetCreateForm = () => {
    setCreateForm({ title: '', description: '', tagsInput: '', overrideAgentId: '' });
    setCreateError(null);
    setSuggestedAgent(null);
  };

  const handleAddTask = async () => {
    if (!createForm.title.trim()) {
      setCreateError('Tiêu đề là bắt buộc.');
      return;
    }
    const tags = createForm.tagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createTask({
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        ...(tags.length > 0 ? { tags } as any : {}),
        ...(createForm.overrideAgentId ? { agent_id: createForm.overrideAgentId } as any : {}),
      } as any);
      setTasks((prev) => [created, ...prev]);
      resetCreateForm();
      setShowAddModal(false);
    } catch (error) {
      console.error('create task failed', error);
      setCreateError('Không tạo được task. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    });
    setEditError(null);
  };

  const handleEditTask = async () => {
    if (!editingTask) return;
    if (!editForm.title.trim()) {
      setEditError('Tiêu đề là bắt buộc.');
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditError(null);
      const updatedTask = await updateTask(editingTask.id, {
        title: editForm.title.trim(),
        description: editForm.description?.trim() || undefined,
        status: editForm.status,
        priority: editForm.priority,
        due_date: editForm.due_date || undefined,
      });
      setTasks((currentTasks) => currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
      setSelectedTask(updatedTask);
      setEditingTask(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Không thể cập nhật công việc.');
    } finally {
      setIsSavingEdit(false);
    }
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
                      <td className="px-4 py-4 text-sm text-slate-700">{getProjectLabel(task)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{getAssigneeLabel(task)}</td>
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
                            <Badge variant="default">{getAssigneeLabel(task)}</Badge>
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
                <p className="text-sm text-slate-900">{getProjectLabel(selectedTask)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Gán cho</p>
                <p className="text-sm text-slate-900">{getAssigneeLabel(selectedTask)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-1">Hạn cuối</p>
              <p className="text-sm text-slate-900">{selectedTask.due_date ? formatDate(selectedTask.due_date) : 'Chưa có'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/tasks/${selectedTask.id}`)}
                className="rounded-lg border border-slate-200 py-2 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Mở chi tiết
              </button>
              <button
                onClick={() => openEditModal(selectedTask)}
                className="rounded-lg bg-deo-accent py-2 font-medium text-white hover:bg-cyan-600 transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </SlidePanel>

      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Chỉnh sửa công việc"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Mô tả</label>
            <textarea
              value={editForm.description || ''}
              onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Trạng thái</label>
              <select
                value={editForm.status}
                onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as Task['status'] }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Ưu tiên</label>
              <select
                value={editForm.priority || 'medium'}
                onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value as Task['priority'] }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Hạn cuối</label>
              <input
                type="date"
                value={editForm.due_date || ''}
                onChange={(event) => setEditForm((current) => ({ ...current, due_date: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
              />
            </div>
          </div>

          {editError && <p className="text-sm text-red-600">{editError}</p>}

          <button
            onClick={handleEditTask}
            disabled={isSavingEdit}
            className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetCreateForm();
        }}
        title="Tạo công việc mới"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Nhập tiêu đề công việc..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Mô tả</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả chi tiết công việc..."
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tags / Capability (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={createForm.tagsInput}
              onChange={(e) => setCreateForm((f) => ({ ...f, tagsInput: e.target.value }))}
              placeholder="vd: legal_draft, contract_review"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-deo-accent" />
              <span className="font-medium text-slate-700">Đề xuất agent:</span>
              <span className="text-slate-900">
                {suggestedAgent ? suggestedAgent.name : 'Tự động chọn khi lưu'}
              </span>
              {suggestedAgent && (
                <span className="text-xs text-slate-400">({suggestedAgent.reason})</span>
              )}
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Đổi agent (tuỳ chọn)</label>
              <select
                value={createForm.overrideAgentId}
                onChange={(e) => setCreateForm((f) => ({ ...f, overrideAgentId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
              >
                <option value="">— Để hệ thống chọn —</option>
                {agentList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}

          <button
            onClick={handleAddTask}
            disabled={isCreating}
            className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? 'Đang tạo...' : 'Tạo công việc'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
