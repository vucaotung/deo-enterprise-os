import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, ListChecks, UserRound } from 'lucide-react';
import type { Task } from '@/types';
import { addTaskComment, getTask, getTaskComments, type TaskComment } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ExecutionsList } from '@/components/ExecutionsList';
import { CommentThread } from '@/components/CommentThread';
import { CommentComposer } from '@/components/CommentComposer';
import { getSocket, initSocket } from '@/lib/socket';
import { formatDate, getPriorityColor, getStatusColor, getStatusLabel, cn } from '@/lib/utils';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

type Tab = 'overview' | 'comments' | 'executions';

export const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [tab, setTab] = useState<Tab>('overview');

  const queryClient = useQueryClient();

  const { data: task, isLoading, isError, error } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: () => getTask(id!),
    enabled: !!id,
  });

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: ['task-comments', id],
    queryFn: () => getTaskComments(id!),
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => addTaskComment(id!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', id] });
    },
  });

  useEffect(() => {
    setPageTitle(task?.title ? `Task • ${task.title}` : 'Chi tiết công việc');
  }, [task?.title, setPageTitle]);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
    const socket = getSocket() || initSocket(token);
    socket.emit('join-task-room', id);
    const onComment = (incoming: TaskComment) => {
      if (incoming.task_id !== id) return;
      queryClient.setQueryData<TaskComment[]>(['task-comments', id], (prev = []) => {
        if (prev.some((c) => c.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    };
    socket.on('comment', onComment);
    return () => {
      socket.off('comment', onComment);
      socket.emit('leave-task-room', id);
    };
  }, [id, queryClient]);

  if (!id) {
    return (
      <div className="p-6 text-sm text-red-600">Không có id công việc trong URL.</div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/tasks')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Về danh sách
      </button>

      {isLoading && <div className="text-sm text-slate-500">Đang tải task...</div>}
      {isError && (
        <div className="text-sm text-red-600">
          Không tải được task: {error instanceof Error ? error.message : 'unknown'}
        </div>
      )}

      {task && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Badge className={cn(getStatusColor(task.status))}>
                  {getStatusLabel(task.status)}
                </Badge>
                {task.priority && (
                  <Badge className={cn(getPriorityColor(task.priority))}>
                    Ưu tiên: {task.priority}
                  </Badge>
                )}
                {task.project_name && (
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" /> {task.project_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                tab === 'overview'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setTab('comments')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                tab === 'comments'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              Bình luận{comments.length > 0 && ` (${comments.length})`}
            </button>
            <button
              type="button"
              onClick={() => setTab('executions')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                tab === 'executions'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              Lần chạy
            </button>
          </div>

          {tab === 'overview' && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {task.description ? (
                    <p className="whitespace-pre-wrap text-slate-700">{task.description}</p>
                  ) : (
                    <p className="italic text-slate-400">Không có mô tả.</p>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <UserRound className="h-4 w-4 text-slate-400" />
                      <span>
                        Phụ trách: {task.assignee_name || task.assigned_to || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        Hạn:{' '}
                        {task.due_date ? formatDate(task.due_date) : '—'}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Tạo: {formatDate(task.created_at)}
                    </div>
                    <div className="text-slate-500">
                      Cập nhật: {formatDate(task.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'comments' && (
            <Card>
              <CardHeader>
                <CardTitle>Bình luận</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CommentThread comments={comments} />
                  <CommentComposer onSubmit={(content) => addCommentMutation.mutateAsync(content)} />
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'executions' && (
            <Card>
              <CardContent>
                <ExecutionsList taskId={id} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
