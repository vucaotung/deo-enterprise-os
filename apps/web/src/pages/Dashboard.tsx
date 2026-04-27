import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DashboardSummary, DashboardCharts } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import api from '@/api/client';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const KPICard = ({
  icon: Icon,
  title,
  value,
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: number;
}) => {
  const isTrendUp = trend && trend > 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="text-slate-400">{Icon}</div>
      </div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {isTrendUp ? (
            <TrendingUp size={16} className="text-green-600" />
          ) : (
            <TrendingDown size={16} className="text-red-600" />
          )}
          <span
            className={`text-xs font-medium ${
              isTrendUp ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </Card>
  );
};

export const Dashboard = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [usingFallback, setUsingFallback] = useState(false);
  const [serverSummary, setServerSummary] = useState<DashboardSummary | null>(null);
  const [serverCharts, setServerCharts] = useState<DashboardCharts | null>(null);

  const [mockSummary] = useState<DashboardSummary>({
    taskCount: 24,
    expenseCount: 12,
    clientCount: 8,
    taskCountByStatus: {
      todo: 18,
      in_progress: 24,
      completed: 45,
      cancelled: 5,
    },
    alerts: [],
  });

  const [mockCharts] = useState<DashboardCharts>({
    expense_by_category: [
      { category: 'Marketing', amount: 4500000 },
      { category: 'Operations', amount: 6200000 },
      { category: 'Payroll', amount: 3000000 },
      { category: 'Other', amount: 2050000 },
    ],
    task_status: [
      { status: 'Completed', count: 45 },
      { status: 'In Progress', count: 24 },
      { status: 'To Do', count: 18 },
      { status: 'Cancelled', count: 5 },
    ],
    recent_activities: [
      {
        id: '1',
        type: 'task',
        description: 'Tạo công việc mới: Phân tích dữ liệu thị trường',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: '2',
        type: 'expense',
        description: 'Thêm chi phí: Quảng cáo Facebook - 1.5M đ',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: '3',
        type: 'lead',
        description: 'Khách hàng mới từ nguồn: Yêu cầu giá',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '4',
        type: 'agent',
        description: 'Agent phân tích dữ liệu hoàn thành 3 công việc',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
      },
    ],
  });

  useEffect(() => {
    setPageTitle('Bảng điều khiển');
  }, [setPageTitle]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/charts'),
        ]);
        if (cancelled) return;

        const s = summaryRes.data;
        setServerSummary({
          taskCount: s.tasks?.total ?? 0,
          expenseCount: s.expenses?.count ?? 0,
          clientCount: s.leads?.total ?? 0,
          taskCountByStatus: {
            todo: s.tasks?.open ?? 0,
            in_progress: s.tasks?.in_progress ?? 0,
            completed: s.tasks?.completed ?? 0,
            cancelled: 0,
          },
        });

        const c = chartsRes.data;
        setServerCharts({
          expense_by_category: (c.expenses_by_month || []).map((row: any) => ({
            category: new Date(row.month).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
            amount: Number(row.total) || 0,
          })),
          task_status: (c.tasks_by_status || []).map((row: any) => ({
            status: row.status,
            count: Number(row.count) || 0,
          })),
          recent_activities: [],
        });
        setUsingFallback(false);
      } catch (err) {
        console.warn('Dashboard API failed, using mock data', err);
        setUsingFallback(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = serverSummary || mockSummary;
  const charts = serverCharts && serverCharts.expense_by_category.length > 0 ? serverCharts : mockCharts;

  const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316'];
  const totalExpenseAmount = charts.expense_by_category.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <AlertCircle size={16} />
          <span>Đang hiển thị dữ liệu mẫu — không kết nối được API.</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard icon={<span className="text-2xl">📋</span>} title="Công việc mở" value={summary.taskCount} trend={12} />
        <KPICard icon={<span className="text-2xl">💸</span>} title="Tổng chi phí" value={formatCurrency(totalExpenseAmount)} trend={-8} />
        <KPICard icon={<span className="text-2xl">👥</span>} title="Khách hàng" value={summary.clientCount} trend={25} />
        <KPICard icon={<span className="text-2xl">🤖</span>} title="Agent online" value={5} />
        <KPICard icon={<span className="text-2xl">❓</span>} title="Chờ làm rõ" value={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chi phí theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.expense_by_category}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {charts.expense_by_category.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái công việc</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.task_status}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {charts.recent_activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b border-slate-200 last:border-b-0"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                        activity.type === 'task'
                          ? 'bg-blue-500'
                          : activity.type === 'expense'
                            ? 'bg-orange-500'
                            : activity.type === 'lead'
                              ? 'bg-green-500'
                              : 'bg-purple-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-slate-900">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cần chú ý</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Task todo</span>
                  <Badge variant="warning">{summary.taskCountByStatus.todo}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Task in progress</span>
                  <Badge variant="info">{summary.taskCountByStatus.in_progress}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Task completed</span>
                  <Badge variant="success">{summary.taskCountByStatus.completed}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
