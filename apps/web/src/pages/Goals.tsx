import { useQuery } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { useActiveCompany } from '@/lib/active-company';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Target } from 'lucide-react';
import type { Goal } from '@/types';

export function GoalsPage() {
  const { id: companyId } = useActiveCompany();
  const goals = useQuery({
    queryKey: ['goals', companyId],
    queryFn: () => paperclip.listGoals(companyId!),
    enabled: !!companyId,
  });

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Outcome statements. Tạo và chỉnh sửa vẫn trong Paperclip UI."
      />
      <div className="space-y-6 p-6">
        {(['company', 'team', 'agent', 'task'] as const).map((lvl) => {
          const items = (goals.data ?? []).filter((g) => g.level === lvl);
          if (items.length === 0) return null;
          return (
            <section key={lvl}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {lvl} goals · {items.length}
              </h2>
              <ul className="space-y-2">
                {items.map((g) => (
                  <GoalRow key={g.id} goal={g} />
                ))}
              </ul>
            </section>
          );
        })}

        {goals.isLoading && <p className="text-sm text-slate-500">Đang tải…</p>}
        {!goals.isLoading && (goals.data?.length ?? 0) === 0 && (
          <EmptyState
            icon={Target}
            title="Chưa có goal nào"
            description="Vào Paperclip UI tạo goal đầu tiên."
          />
        )}
      </div>
    </div>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  return (
    <li>
      <Card className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{goal.title}</h3>
          {goal.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {goal.description}
            </p>
          )}
        </div>
        <StatusBadge status={goal.status} />
      </Card>
    </li>
  );
}
