import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { useActiveCompany } from '@/lib/active-company';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ListChecks } from 'lucide-react';
import type { Issue, IssueStatus } from '@/types';

const COLUMNS: IssueStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'done',
];

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const { id: companyId } = useActiveCompany();

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => paperclip.getProject(id),
    enabled: !!id,
  });

  const issues = useQuery({
    queryKey: ['project-issues', companyId, id],
    queryFn: () => paperclip.listIssues(companyId!, { projectId: id }),
    enabled: !!companyId && !!id,
  });

  return (
    <div>
      <PageHeader
        title={project.data?.name ?? 'Project'}
        subtitle={project.data?.description ?? undefined}
        actions={project.data && <StatusBadge status={project.data.status} />}
      />
      <div className="p-6">
        {issues.isLoading && <p className="text-sm text-slate-500">Đang tải issues…</p>}
        {!issues.isLoading && (issues.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={ListChecks}
            title="Chưa có issue nào"
            description="Vào Paperclip UI tạo issue đầu tiên trong project này."
          />
        )}
        {(issues.data?.length ?? 0) > 0 && (
          <div className="grid gap-4 lg:grid-cols-6">
            {COLUMNS.map((col) => (
              <Column key={col} status={col} issues={issues.data ?? []} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ status, issues }: { status: IssueStatus; issues: Issue[] }) {
  const items = issues.filter((i) => i.status === status);
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {status.replace('_', ' ')}
        </h3>
        <span className="text-xs text-slate-400">{items.length}</span>
      </header>
      <ul className="space-y-2">
        {items.map((issue) => (
          <li key={issue.id}>
            <Link to={`/issues/${issue.id}`}>
              <Card className="p-3 text-sm hover:border-deo-accent">
                <p className="font-medium text-slate-900">{issue.title}</p>
                {issue.shortname && (
                  <p className="mt-1 text-xs text-slate-500">{issue.shortname}</p>
                )}
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
