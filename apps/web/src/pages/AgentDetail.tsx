import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { Pause, Play, Bell } from 'lucide-react';

export function AgentDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();

  const agent = useQuery({
    queryKey: ['agent', id],
    queryFn: () => paperclip.getAgent(id),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['agent', id] });

  const pause = useMutation({
    mutationFn: () => paperclip.pauseAgent(id),
    onSuccess: invalidate,
  });
  const resume = useMutation({
    mutationFn: () => paperclip.resumeAgent(id),
    onSuccess: invalidate,
  });
  const wake = useMutation({
    mutationFn: () => paperclip.wakeAgent(id),
    onSuccess: invalidate,
  });

  const a = agent.data;
  const busy = pause.isPending || resume.isPending || wake.isPending;

  return (
    <div>
      <PageHeader
        title={a?.name ?? 'Agent'}
        subtitle={a?.role ?? undefined}
        actions={a && <StatusBadge status={a.status} />}
      />
      <div className="space-y-4 p-6">
        <Card className="space-y-3 p-4">
          <Field label="Adapter" value={<span className="font-mono">{a?.adapterType}</span>} />
          <Field label="Manager" value={a?.managerId ?? '—'} />
          <Field
            label="Last heartbeat"
            value={
              a?.lastHeartbeatAt
                ? new Date(a.lastHeartbeatAt).toLocaleString('vi-VN')
                : '—'
            }
          />
        </Card>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || a?.status === 'paused'}
            onClick={() => pause.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
          <button
            type="button"
            disabled={busy || a?.status === 'active'}
            onClick={() => resume.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-deo-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" /> Resume
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => wake.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Bell className="h-3.5 w-3.5" /> Wake
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}
