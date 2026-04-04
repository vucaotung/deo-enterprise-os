import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Task } from '@/types';
import { KanbanBoard } from '@/components/KanbanBoard';
import { SlidePanel } from '@/components/SlidePanel';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Plus, Layout, List, HelpCircle } from 'lucide-react';
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Phân tích dữ liệu thị trường',
    description: 'Phân tích xu hướng bán hàng',
    status: 'IN_PROGRESS',
    priority: 'high',
    company_id: 'c1',
    project_id: 'p1',
    assigned_to: 'u1',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_clarification: true,
    clarification_count: 1,
    assignee: {
      id: 'u1',
      email: 'user1@company.com',
      name: 'Trần Thị B',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '2',
    title: 'Chuẩn bị báo cáo hàng tháng',
    description: 'Tổng hợp báo cáo tài chính',
    status: 'TODO',
    priority: 'medium',
    company_id: 'c1',
    project_id: 'p1',
    assigned_to: 'u2',
    due_date: new Date(Date.now() + 259200000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_clarification: false,
    clarification_count: 0,
    assignee: {
      id: 'u2',
      email: 'user2@company.com',
      name: 'Lê Hoàng C',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '3',
    title: 'Theo dõi khách hàng tiềm năng',
    description: 'Liên hệ khách hàng mới',
    status: 'BLOCKED',
    priority: 'critical',
    company_id: 'c1',
    project_id: 'p2',
    assigned_to: 'u3',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_clarification: false,
    clarification_count: 0,
    assignee: {
      id: 'u3',
      email: 'user3@company.com',
      name: 'Phạm Hồng D',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '4',
    title: 'Cập nhật chính sách công ty',
    description: 'Cập nhật tài liệu chính sách',
    status: 'IN_REVIEW',
    priority: 'low',
    company_id: 'c1',
    project_id: 'p1',
    assigned_to: 'u1',
    due_date: new Date(Date.now() + 172800000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_clarification: false,
    clarification_count: 0,
    assignee: {
      id: 'u1',
      email: 'user1@company.com',
      name: 'Trần Thị B',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '5',
    title: 'Hoàn thành dự án web',
    description: 'Triển khai website mới',
    status: 'DONE',
    priority: 'high',
    company_id: 'c1',
    project_id: 'p3',
    assigned_to: 'u2',
    due_date: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_clarification: false,
    clarification_count: 0,
    assignee: {
      id: 'u2',
      email: 'user2@company.com',
      name: 'Lê Hoàng C',
      role: 'user',
      company_id: 'c1',
    },
  },
];

export const Tasks = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  useEffect(() => {
    setPageTitle('Công việc');
  }, [setPageTitle]);

  const kanbanColumns = [
    { id: 'TODO', title: 'Chưa làm' },
    { id: 'IN_PROGRESS', title: 'Đang làm' },
    { id: 'BLOCKED', title: 'Bị chặn' },
    { id: 'IN_REVIEW', title: 'Đang duyệt' },
    { id: 'DONE', title: 'Hoàn thành' },
  ];

  const kanbanCards = kanbanColumns.reduce(
    (acc, col) => {
      acc[col.id] = tasks
        .filter((t) => t.status === col.id)
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.assignee?.name,
          badges: [
            <Badge
              key="priority"
              size="sm"
              className={getPriorityColor(task.priority)}
            >
              {task.priority}
            </Badge>,
            task.has_clarification && (
              <span key="clarification" className="text-orange-600 text-sm">
                <HelpCircle size={14} className="inline mr-1" />
                {task.clarification_count}
              </span>
            ),
          ].filter(Boolean),
        }));
      return acc;
    },
    {} as Record<string, any[]>
  );

  const handleAddTask = () => {
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-deo-accent text-white'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            <Layout size={16} />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-deo-accent text-white'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            <List size={16} />
            Danh sách
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
        >
          <Plus size={16} />
          Thêm công việc
        </button>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          cards={kanbanCards}
          onCardClick={(cardId) => {
            const task = tasks.find((t) => t.id === cardId);
            if (task) setSelectedTask(task);
          }}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Công việc
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Gán cho
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Ưu tiên
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Hạn
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{task.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {task.assignee?.name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {formatDate(task.due_date)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              <p className="text-slate-600">{selectedTask.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Ưu tiên</p>
                <Badge className={getPriorityColor(selectedTask.priority)}>
                  {selectedTask.priority}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Trạng thái</p>
                <Badge className={getStatusColor(selectedTask.status)}>
                  {selectedTask.status}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-2">Gán cho</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-deo-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {selectedTask.assignee?.name.charAt(0)}
                </div>
                <p className="text-sm text-slate-900">
                  {selectedTask.assignee?.name}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-1">Hạn cuối</p>
              <p className="text-sm text-slate-900">
                {formatDate(selectedTask.due_date)}
              </p>
            </div>

            {selectedTask.has_clarification && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                  <HelpCircle size={16} />
                  Có {selectedTask.clarification_count} câu hỏi chưa trả lời
                </p>
              </div>
            )}

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
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tiêu đề
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề công việc..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Mô tả
            </label>
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
