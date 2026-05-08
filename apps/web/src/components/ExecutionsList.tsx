import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Play, Loader2 } from 'lucide-react';
import type { TaskExecutionListRow, TaskExecutionStatus } from '@/types';
import { getTaskExecutions, createTaskExecution } from '@/api/client';
import { Badge } from '@/components/Badge';
import { formatDate } from '@/lib/utils';
import { AgentJobCard } from '@/components/AgentJobCard';

interface Props {
  taskId: string;
}

const ACTIVE_STATUSES: TaskExecutionStatus[] = ['pending', 'running'];

const statusVariant: Record<TaskExecutionStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'default',
  running: 'info',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'warning',
  needs_review: 'warning',
};

const statusLabel: Record<TaskExecutionStatus, string> = {
  pending: 'Chờ',
  running: 'Đang chạy',
  succeeded: 'Thành công',
  failed: 'Thất bại',
  cancelled: 'Huỷ',
  needs_review: 'Cần review',
};

export const ExecutionsList = ({ taskId }: Props) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: executions = [], isLoading, isError, error, refetch } = useQuery<
    TaskExecutionListRow[]
  >({
    queryKey: ['task-executions', taskId],
    queryFn: () => getTaskExecutions(taskId),
    refetchInterval: (query) => {
      const rows = query.state.data;
      return rows && rows.some((row) => ACTIVE_STATUSES.includes(row.status)) ? 5000 : false;
    },
  });

  const startMutation = useMutation({
    mutationFn: () => createTaskExecution(taskId, { trigger_reason: 'manual' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-executions', taskId] });
    },
  });

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Lần chạy</h3>
          <p className="text-xs text-slate-500">
            Mỗi lần chạy sinh 1 agent_job; click để xem log, retry hoặc huỷ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          {startMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Chạy mới
        </button>
      </div>

      {startMutation.isError && (
        <div className="text-xs text-red-600">
          Tạo lần chạy thất bại:{' '}
          {startMutation.error instanceof Error ? startMutation.error.message : 'unknown'}
        </div>
      )}

      {isLoading && <div className="text-sm text-slate-500">Đang tải lịch sử...</div>}
      {isError && (
        <div className="text-sm text-red-600">
          Không tải được executions: {error instanceof Error ? error.message : 'unknown'}{' '}
          <button onClick={() => refetch()} className="underline">
            thử lại
          </button>
        </div>
      )}

      {!isLoading && !isError && executions.length === 0 && (
        <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Chưa có lần chạy nào. Bấm "Chạy mới" để khởi tạo.
        </div>
      )}

      <ul className="space-y-2">
        {executions.map((row) => {
          const isOpen = !!expanded[row.id];
          return (
            <li
              key={row.id}
              className="overflow-hidden rounded-md border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => toggle(row.id)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    Lần thử #{row.attempt_number}
                  </span>
                  <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
                  {row.agent_job_runtime_type && (
                    <span className="text-xs text-slate-500">
                      runtime: {row.agent_job_runtime_type}
                    </span>
                  )}
                  {row.trigger_reason && (
                    <span className="text-xs text-slate-400">trigger: {row.trigger_reason}</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {row.finished_at
                    ? `Kết thúc ${formatDate(row.finished_at)}`
                    : row.started_at
                      ? `Bắt đầu ${formatDate(row.started_at)}`
                      : `Tạo ${formatDate(row.created_at)}`}
                </div>
              </button>

              {isOpen && row.agent_job_id && (
                <div className="border-t border-slate-100 bg-slate-50/40 px-3 py-3">
                  <AgentJobCard
                    agentJobId={row.agent_job_id}
                    onMutationSuccess={() =>
                      queryClient.invalidateQueries({ queryKey: ['task-executions', taskId] })
                    }
                  />
                </div>
              )}
              {isOpen && !row.agent_job_id && (
                <div className="border-t border-slate-100 px-3 py-3 text-xs text-slate-400">
                  Lần chạy này chưa có agent_job kèm theo.
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
