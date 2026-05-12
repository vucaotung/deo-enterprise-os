import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { useActiveCompany } from '@/lib/active-company';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Search, ListChecks } from 'lucide-react';
import type { IssueStatus } from '@/types';

const STATUS_FILTERS: (IssueStatus | 'all')[] = [
  'all',
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'done',
];

export function IssuesPage() {
  const { id: companyId } = useActiveCompany();
  const [status, setStatus] = useState<IssueStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const issues = useQuery({
    queryKey: ['issues', companyId, status, search],
    queryFn: () =>
      paperclip.listIssues(companyId!, {
        status: status === 'all' ? undefined : status,
        search: search || undefined,
      }),
    enabled: !!companyId,
  });

  return (
    <div>
      <PageHeader
        title="Issues"
        subtitle="Tất cả issues thuộc company. Click để vào chat thread với agent."
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề…"
              className="w-72 rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-deo-accent focus:outline-none focus:ring-1 focus:ring-deo-accent"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  s === status
                    ? 'border-deo-accent bg-deo-accent text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {issues.isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}
        {!issues.isLoading && (issues.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={ListChecks}
            title="Không có issue khớp lọc"
            description="Thử bỏ search hoặc đổi status."
          />
        )}

        <ul className="space-y-2">
          {issues.data?.map((i) => (
            <li key={i.id}>
              <Link to={`/issues/${i.id}`}>
                <Card className="flex items-center justify-between gap-3 p-3 hover:border-deo-accent">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {i.title}
                    </p>
                    {i.shortname && (
                      <p className="text-xs text-slate-500">{i.shortname}</p>
                    )}
                  </div>
                  <StatusBadge status={i.status} />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
