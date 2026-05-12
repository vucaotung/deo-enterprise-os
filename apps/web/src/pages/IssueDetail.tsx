import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { CommentComposer } from '@/components/CommentComposer';
import { IssueTimeline } from '@/components/IssueTimeline';
import { EmptyState } from '@/components/EmptyState';
import { ListChecks } from 'lucide-react';
import type { HeartbeatRun, IssueComment } from '@/types';

export function IssueDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();

  const issue = useQuery({
    queryKey: ['issue', id],
    queryFn: () => paperclip.getIssue(id),
    enabled: !!id,
  });

  const comments = useQuery({
    queryKey: ['issue-comments', id],
    queryFn: () => paperclip.listIssueComments(id),
    enabled: !!id,
  });

  const runs = useQuery({
    queryKey: ['issue-runs', id],
    queryFn: () => paperclip.listIssueRuns(id),
    enabled: !!id,
  });

  const post = useMutation({
    mutationFn: (body: string) =>
      paperclip.postIssueComment(id, {
        body,
        mentions: extractMentions(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issue-comments', id] });
    },
  });

  const items = useMemo(
    () => mergeTimeline(comments.data ?? [], runs.data ?? []),
    [comments.data, runs.data],
  );

  if (!issue.data && !issue.isLoading) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Không tìm thấy issue"
        description="Có thể đã bị xóa hoặc ngoài phạm vi company hiện tại."
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={issue.data?.title ?? 'Issue'}
        subtitle={issue.data?.shortname}
        actions={issue.data && <StatusBadge status={issue.data.status} />}
      />

      <div className="grid flex-1 gap-6 overflow-hidden p-6 lg:grid-cols-[1fr_320px]">
        <section className="flex min-h-0 flex-col gap-4">
          {issue.data?.description && (
            <Card className="text-sm text-slate-700">
              <p className="whitespace-pre-wrap">{issue.data.description}</p>
            </Card>
          )}

          <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
            <IssueTimeline items={items} />
          </div>

          <CommentComposer
            disabled={post.isPending}
            onSubmit={(body) => post.mutateAsync(body)}
            placeholder="Viết bình luận. Dùng @agent-name để đánh thức agent. (Ctrl+Enter để gửi)"
          />
        </section>

        <aside className="space-y-4">
          <Card>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assigned agent
            </h3>
            <p className="text-sm text-slate-900">
              {issue.data?.assignedAgentId ?? '—'}
            </p>
          </Card>
          <Card>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent runs
            </h3>
            <ul className="space-y-1 text-xs">
              {(runs.data ?? []).slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span className="font-mono text-slate-500">
                    {r.id.slice(0, 8)}
                  </span>
                  <span className="font-medium text-slate-700">{r.status}</span>
                </li>
              ))}
              {(runs.data ?? []).length === 0 && (
                <li className="text-slate-400">Chưa có run nào.</li>
              )}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function extractMentions(body: string): string[] {
  const matches = body.match(/@([a-zA-Z0-9_.-]+)/g) ?? [];
  return matches.map((m) => m.slice(1));
}

export interface TimelineItem {
  key: string;
  at: string;
  kind: 'comment' | 'run';
  comment?: IssueComment;
  run?: HeartbeatRun;
}

function mergeTimeline(
  comments: IssueComment[],
  runs: HeartbeatRun[],
): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const c of comments) {
    items.push({ key: `c:${c.id}`, at: c.createdAt, kind: 'comment', comment: c });
  }
  for (const r of runs) {
    items.push({
      key: `r:${r.id}`,
      at: r.startedAt ?? r.finishedAt ?? '',
      kind: 'run',
      run: r,
    });
  }
  return items
    .filter((i) => i.at)
    .sort((a, b) => a.at.localeCompare(b.at));
}
