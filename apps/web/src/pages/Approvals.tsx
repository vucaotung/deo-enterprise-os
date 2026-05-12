import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { useActiveCompany } from '@/lib/active-company';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ShieldCheck, Check, X, MessageSquare } from 'lucide-react';
import type { Approval } from '@/types';

export function ApprovalsPage() {
  const { id: companyId } = useActiveCompany();
  const qc = useQueryClient();
  const approvals = useQuery({
    queryKey: ['approvals', companyId, 'pending'],
    queryFn: () => paperclip.listApprovals(companyId!, 'pending'),
    enabled: !!companyId,
  });

  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      paperclip.approveApproval(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', companyId] }),
  });
  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      paperclip.rejectApproval(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', companyId] }),
  });
  const revise = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      paperclip.requestApprovalRevision(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals', companyId] }),
  });

  const list = approvals.data ?? [];

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle="Hire agent, CEO strategy, budget override — duyệt hoặc trả lại."
      />
      <div className="space-y-3 p-6">
        {approvals.isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}
        {!approvals.isLoading && list.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title="Inbox approvals trống"
            description="Tất cả pending approvals đã được xử lý."
          />
        )}
        {list.map((a) => (
          <ApprovalRow
            key={a.id}
            approval={a}
            onApprove={() => approve.mutate({ id: a.id })}
            onReject={() => {
              const note = window.prompt('Lý do reject?') ?? '';
              if (note.trim().length > 0) reject.mutate({ id: a.id, note });
            }}
            onRevise={() => {
              const note = window.prompt('Cần chỉnh sửa gì?') ?? '';
              if (note.trim().length > 0) revise.mutate({ id: a.id, note });
            }}
            busy={approve.isPending || reject.isPending || revise.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function ApprovalRow({
  approval,
  onApprove,
  onReject,
  onRevise,
  busy,
}: {
  approval: Approval;
  onApprove: () => void;
  onReject: () => void;
  onRevise: () => void;
  busy: boolean;
}) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {humanizeType(approval.type)}
          </p>
          <p className="text-xs text-slate-500">
            Proposed by {approval.proposerAgentId ?? 'system'} ·{' '}
            {new Date(approval.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <StatusBadge status={approval.status} />
      </div>

      <pre className="overflow-x-auto rounded bg-slate-50 p-3 text-xs text-slate-700">
        {JSON.stringify(approval.payload, null, 2)}
      </pre>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRevise}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Request revision
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </Card>
  );
}

function humanizeType(t: Approval['type']): string {
  switch (t) {
    case 'hire_agent':
      return 'Hire agent';
    case 'approve_ceo_strategy':
      return 'CEO strategy';
    case 'budget_override_required':
      return 'Budget override';
    case 'request_board_approval':
      return 'Board approval requested';
    default:
      return t;
  }
}
