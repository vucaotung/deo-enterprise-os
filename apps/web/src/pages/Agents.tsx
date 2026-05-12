import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { useActiveCompany } from '@/lib/active-company';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Bot } from 'lucide-react';

export function AgentsPage() {
  const { id: companyId } = useActiveCompany();
  const agents = useQuery({
    queryKey: ['agents', companyId],
    queryFn: () => paperclip.listAgents(companyId!),
    enabled: !!companyId,
  });

  return (
    <div>
      <PageHeader title="Agents" subtitle="Roster của company." />
      <div className="p-6">
        {agents.isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}
        {!agents.isLoading && (agents.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={Bot}
            title="Chưa có agent nào"
            description="Hire CEO + worker agents trong Paperclip UI rồi quay lại."
          />
        )}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.data?.map((a) => (
            <li key={a.id}>
              <Link to={`/agents/${a.id}`}>
                <Card className="h-full p-4 transition-colors hover:border-deo-accent">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {a.name}
                      </h3>
                      {a.role && (
                        <p className="text-xs text-slate-500">{a.role}</p>
                      )}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Adapter: <span className="font-mono">{a.adapterType}</span>
                  </p>
                  {a.lastHeartbeatAt && (
                    <p className="mt-1 text-xs text-slate-400">
                      Last heartbeat:{' '}
                      {new Date(a.lastHeartbeatAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
