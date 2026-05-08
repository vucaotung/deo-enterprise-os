import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Square, Terminal, Coins, DollarSign, Clock } from 'lucide-react';
import type { AgentJob, AgentJobQueueState } from '@/types';
import { getAgentJob, retryAgentJob, cancelAgentJob } from '@/api/client';
import { Badge } from '@/components/Badge';
import { formatDate } from '@/lib/utils';

interface Props {
  agentJobId: string;
  onMutationSuccess?: () => void;
}

const ACTIVE_STATES: AgentJobQueueState[] = ['queued', 'claimed', 'running'];

const queueStateVariant: Record<AgentJobQueueState, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  queued: 'default',
  claimed: 'info',
  running: 'info',
  done: 'success',
  dead: 'error',
  cancelled: 'warning',
};

const queueStateLabel: Record<AgentJobQueueState, string> = {
  queued: 'Đang chờ',
  claimed: 'Đã nhận',
  running: 'Đang chạy',
  done: 'Xong',
  dead: 'Lỗi',
  cancelled: 'Đã huỷ',
};

const formatNullableNumber = (value: number | null | undefined, suffix = ''): string =>
  value === null || value === undefined ? '—' : `${value}${suffix}`;

const formatCost = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toFixed(4)}`;
};

const formatDateOrDash = (value?: string | null): string => (value ? formatDate(value) : '—');

const formatDuration = (started?: string | null, finished?: string | null): string => {
  if (!started) return '—';
  const start = new Date(started).getTime();
  const end = finished ? new Date(finished).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rs = seconds % 60;
  return `${minutes}m${rs.toString().padStart(2, '0')}s`;
};

export const AgentJobCard = ({ agentJobId, onMutationSuccess }: Props) => {
  const queryClient = useQueryClient();

  const { data: job, isLoading, isError, error } = useQuery<AgentJob>({
    queryKey: ['agent-job', agentJobId],
    queryFn: () => getAgentJob(agentJobId),
    refetchInterval: (query) => {
      const state = query.state.data?.queue_state;
      return state && ACTIVE_STATES.includes(state) ? 2000 : false;
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryAgentJob(agentJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-job', agentJobId] });
      onMutationSuccess?.();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAgentJob(agentJobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-job', agentJobId] });
      onMutationSuccess?.();
    },
  });

  const isActive = useMemo(
    () => (job ? ACTIVE_STATES.includes(job.queue_state) : false),
    [job]
  );

  if (isLoading) {
    return <div className="text-sm text-slate-500">Đang tải agent_job...</div>;
  }
  if (isError || !job) {
    return (
      <div className="text-sm text-red-600">
        Không tải được agent_job: {error instanceof Error ? error.message : 'unknown'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={queueStateVariant[job.queue_state]} size="md">
            {queueStateLabel[job.queue_state]}
          </Badge>
          <span className="text-sm font-medium text-slate-700">{job.runtime_type}</span>
          <span className="text-xs text-slate-400">#{job.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!isActive || cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Square className="h-3 w-3" /> Huỷ
          </button>
          <button
            type="button"
            disabled={isActive || retryMutation.isPending}
            onClick={() => retryMutation.mutate()}
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-3 w-3" /> Chạy lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Thời lượng: {formatDuration(job.started_at, job.finished_at)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-slate-400" />
          <span>
            Tokens: {formatNullableNumber(job.tokens_in)} / {formatNullableNumber(job.tokens_out)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-slate-400" />
          <span>Cost: {formatCost(job.cost_usd)}</span>
        </div>
        <div className="text-slate-500">Bắt đầu: {formatDateOrDash(job.started_at)}</div>
      </div>

      {job.log_tail ? (
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Terminal className="h-3.5 w-3.5" /> Log tail
          </div>
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
            {job.log_tail}
          </pre>
        </div>
      ) : (
        <div className="text-xs italic text-slate-400">Chưa có log.</div>
      )}

      {job.output && Object.keys(job.output).length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-600">Output JSON</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-50 p-2 text-slate-700">
            {JSON.stringify(job.output, null, 2)}
          </pre>
        </details>
      )}

      {(retryMutation.isError || cancelMutation.isError) && (
        <div className="text-xs text-red-600">
          {retryMutation.error instanceof Error
            ? retryMutation.error.message
            : cancelMutation.error instanceof Error
              ? cancelMutation.error.message
              : 'Thao tác thất bại.'}
        </div>
      )}
    </div>
  );
};
