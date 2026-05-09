import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Plus, MessageCircle, User2, ChevronRight, Send } from 'lucide-react';
import {
  getRequests,
  createRequest,
  updateRequest,
  getRequest,
  getRequestComments,
  addRequestComment,
  getAgents,
} from '@/api/client';
import { Card, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { SlidePanel } from '@/components/SlidePanel';
import { Modal } from '@/components/Modal';
import type { Agent } from '@/types';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Mở',
  in_progress: 'Đang xử lý',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  resolved: 'Đã giải quyết',
  closed: 'Đóng',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  open: 'info',
  in_progress: 'warning',
  approved: 'success',
  rejected: 'error',
  resolved: 'success',
  closed: 'default',
};

const TYPE_LABELS: Record<string, string> = {
  general: 'Chung',
  task_request: 'Yêu cầu công việc',
  review: 'Duyệt',
  data_pull: 'Truy vấn dữ liệu',
  clarification: 'Làm rõ',
};

const PRIORITY_VARIANTS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  urgent: 'error',
  high: 'warning',
  normal: 'info',
  low: 'default',
};

export const Requests = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [assigningAgent, setAssigningAgent] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'normal',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setPageTitle('Requests');
  }, [setPageTitle]);

  useEffect(() => {
    loadRequests();
    getAgents({ status: 'online' }).then(setAgents).catch(() => {});
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await getRequests(statusFilter ? { status: statusFilter } : undefined);
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openRequest = async (req: any) => {
    setSelectedRequest(req);
    setCommentsLoading(true);
    try {
      const [detail, cmts] = await Promise.all([
        getRequest(req.id),
        getRequestComments(req.id),
      ]);
      setSelectedRequest(detail);
      setComments(cmts);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedRequest) return;
    setSendingComment(true);
    try {
      const comment = await addRequestComment(selectedRequest.id, { content: newComment.trim() });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch {
      // silent
    } finally {
      setSendingComment(false);
    }
  };

  const handleAssignAgent = async (agentId: string | null) => {
    if (!selectedRequest) return;
    setAssigningAgent(true);
    try {
      const updated = await updateRequest(selectedRequest.id, { assigned_agent: agentId });
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    } catch {
      // silent
    } finally {
      setAssigningAgent(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedRequest) return;
    try {
      const updated = await updateRequest(selectedRequest.id, { status });
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    } catch {
      // silent
    }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    setCreating(true);
    try {
      const newReq = await createRequest({
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        type: createForm.type,
        priority: createForm.priority,
      });
      setRequests((prev) => [newReq, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', type: 'general', priority: 'normal' });
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                statusFilter === s
                  ? 'bg-deo-accent text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === '' ? 'Tất cả' : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-deo-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          <Plus size={14} />
          Tạo Request
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Đang tải...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Không có request nào</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {requests.map((req) => (
                <li
                  key={req.id}
                  onClick={() => openRequest(req)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={STATUS_VARIANTS[req.status] || 'default'}>
                        {STATUS_LABELS[req.status] || req.status}
                      </Badge>
                      <Badge variant={PRIORITY_VARIANTS[req.priority] || 'default'}>
                        {req.priority}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {TYPE_LABELS[req.type] || req.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{req.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {req.created_by_name && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User2 size={10} /> {req.created_by_name}
                        </span>
                      )}
                      {req.agent_name && (
                        <span className="text-xs text-slate-500">Agent: {req.agent_name}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Detail Panel */}
      <SlidePanel
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.title || 'Request'}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            {/* Meta */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={STATUS_VARIANTS[selectedRequest.status] || 'default'}>
                {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
              </Badge>
              <Badge variant={PRIORITY_VARIANTS[selectedRequest.priority] || 'default'}>
                {selectedRequest.priority}
              </Badge>
              <Badge variant="default">{TYPE_LABELS[selectedRequest.type] || selectedRequest.type}</Badge>
            </div>

            {selectedRequest.description && (
              <p className="text-sm text-slate-700 whitespace-pre-line">{selectedRequest.description}</p>
            )}

            {/* Context link */}
            {selectedRequest.context_type && selectedRequest.context_id && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <span className="text-slate-500">Context: </span>
                {selectedRequest.context_type === 'task' ? (
                  <Link
                    to={`/tasks/${selectedRequest.context_id}`}
                    className="text-deo-accent hover:underline"
                  >
                    {selectedRequest.context_object?.title || selectedRequest.context_id}
                  </Link>
                ) : selectedRequest.context_type === 'project' ? (
                  <Link
                    to={`/projects/${selectedRequest.context_id}`}
                    className="text-deo-accent hover:underline"
                  >
                    {selectedRequest.context_object?.name || selectedRequest.context_id}
                  </Link>
                ) : (
                  <span>{selectedRequest.context_id}</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {/* Status change */}
              <select
                value={selectedRequest.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-deo-accent"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>

              {/* Assign agent (Pull) */}
              <select
                value={selectedRequest.assigned_agent || ''}
                onChange={(e) => handleAssignAgent(e.target.value || null)}
                disabled={assigningAgent}
                className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-deo-accent disabled:opacity-50"
              >
                <option value="">Kéo agent vào...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.display_name}</option>
                ))}
              </select>
            </div>

            {/* Comments */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <MessageCircle size={14} />
                Comments
              </h3>

              {commentsLoading ? (
                <p className="text-xs text-slate-400">Đang tải...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có comment nào</p>
              ) : (
                <ul className="space-y-3 mb-4">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className={`rounded-lg p-3 text-sm ${
                        c.author_type === 'agent'
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        {c.author_type === 'agent' ? `🤖 Agent: ${c.author_id}` : `👤 ${c.author_id}`}
                      </p>
                      <p className="text-slate-800 whitespace-pre-line">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendComment();
                  }}
                  placeholder="Thêm comment... (Ctrl+Enter để gửi)"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-deo-accent"
                />
                <button
                  onClick={handleSendComment}
                  disabled={sendingComment || !newComment.trim()}
                  className="self-end bg-deo-accent text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo Request mới">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề *</label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
              placeholder="Mô tả ngắn gọn yêu cầu..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-deo-accent"
              placeholder="Chi tiết về yêu cầu..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Độ ưu tiên</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
              >
                <option value="low">Thấp</option>
                <option value="normal">Bình thường</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !createForm.title.trim()}
              className="px-4 py-2 text-sm bg-deo-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Đang tạo...' : 'Tạo Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
