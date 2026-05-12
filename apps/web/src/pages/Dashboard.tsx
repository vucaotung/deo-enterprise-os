import { useQuery } from '@tanstack/react-query';
import { paperclip } from '@/api/paperclip';
import { useActiveCompany } from '@/lib/active-company';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { LayoutDashboard } from 'lucide-react';

export function DashboardPage() {
  const { id: companyId } = useActiveCompany();

  const dashboard = useQuery({
    queryKey: ['dashboard', companyId],
    queryFn: () => paperclip.getDashboard(companyId!),
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Chưa có company"
        description="Tạo company trong Paperclip rồi quay lại đây."
      />
    );
  }

  const d = dashboard.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Snapshot từ Paperclip — agents, tasks, costs, budgets."
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1 text-sm text-slate-700">
              <Row label="active" value={d?.agents.active} />
              <Row label="running" value={d?.agents.running} />
              <Row label="paused" value={d?.agents.paused} />
              <Row label="error" value={d?.agents.error} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1 text-sm text-slate-700">
              <Row label="open" value={d?.tasks.open} />
              <Row label="in progress" value={d?.tasks.inProgress} />
              <Row label="blocked" value={d?.tasks.blocked} />
              <Row label="completed" value={d?.tasks.completed} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1 text-sm text-slate-700">
              <Row label="month spend" value={d?.costs.monthSpend} fmt="usd" />
              <Row label="month budget" value={d?.costs.monthBudget} fmt="usd" />
              <Row
                label="utilisation"
                value={d ? `${Math.round(d.costs.utilization * 100)}%` : undefined}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1 text-sm text-slate-700">
              <Row label="active incidents" value={d?.budgets.activeIncidents} />
              <Row label="pending approvals" value={d?.budgets.pendingApprovals} />
              <Row label="paused resources" value={d?.budgets.pausedResources} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  fmt,
}: {
  label: string;
  value: number | string | undefined;
  fmt?: 'usd';
}) {
  const display =
    value === undefined
      ? '—'
      : fmt === 'usd' && typeof value === 'number'
        ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : String(value);
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{display}</dd>
    </div>
  );
}
