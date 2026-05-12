import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { useActiveCompany } from '@/lib/active-company';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { FolderKanban } from 'lucide-react';

export function ProjectsPage() {
  const { id: companyId } = useActiveCompany();
  const projects = useQuery({
    queryKey: ['projects', companyId],
    queryFn: () => paperclip.listProjects(companyId!),
    enabled: !!companyId,
  });

  return (
    <div>
      <PageHeader title="Projects" subtitle="Containers cho deliverables." />
      <div className="p-6">
        {projects.isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}
        {!projects.isLoading && (projects.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="Chưa có project nào"
            description="Vào Paperclip UI tạo project đầu tiên."
          />
        )}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data?.map((p) => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}`}>
                <Card className="h-full p-4 transition-colors hover:border-deo-accent">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.description && (
                    <p className="line-clamp-3 text-sm text-slate-600">
                      {p.description}
                    </p>
                  )}
                  {p.targetDate && (
                    <p className="mt-3 text-xs text-slate-500">
                      Target: {new Date(p.targetDate).toLocaleDateString('vi-VN')}
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
