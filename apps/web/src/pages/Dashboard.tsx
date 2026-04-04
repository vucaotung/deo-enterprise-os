import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardSummary, DashboardCharts } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
  Legend,
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
  const [mockSummary] = useState<DashboardSummary>({
    open_tasks: 24,
    total_expenses: 15750000,
    new_leads: 8,
    agents_online: 5,
    pending_clarifications: 3,
    task_trend: 12,
    expense_trend: -8,
    lead_trend: 25,
  });

  const [mockCharts] = useState<DashboardCharts>({
    expense_by_category: [
      { category: 'Tiếp thị', amount: 4500000 },
      { category: 'Vận hành', amount: 6200000 },
      { category: 'Nhân sự', amount: 3000000 },
      { category: 'Khác', amount: 2050000 },
    ],
    task_status: [
      { status: 'Hoàn thành', count: 45 },
      { status: 'Đang làm', count: 24 },
      { status: 'Chưa làm', count: 18 },
      { status: 'Bị chặn', count: 5 },
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
        description: 'Agent "Phân tích dữ liệu" hoàn thành 3 công việc',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
      },
    ],
  });

  useEffect(() => {
    setPageTitle('Bảng điều khiển');
  }, [setPageTitle]);

  const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={<span className="text-2xl">📋</span>}
          title="Công việc mở"
          value={mockSummary.open_tasks}
          trend={mockSummary.task_trend}
        />
        <KPICard
          icon={<span className="text-2xl">💰</span>}
          title="Tổng chi phí"
          value={formatCurrency(mockSummary.total_expenses)}
          trend={mockSummary.expense_trend}
        />
        <KPICard
          icon={<span className="text-2xl">🔥</span>}
          title="Lead mới"
          value={mockSummary.new_leads}
          trend={mockSummary.lead_trend}
        />
        <KPICard
          icon={<span className="text-2xl">⚡</span>}
          title="Agent online"
          value={mockSummary.agents_online}
        />
        <KPICard
          icon={<span className="text-2xl">❓</span>}
          title="Chờ làm rõ"
          value={mockSummary.pending_clarifications}
        />
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
                  data={mockCharts.expense_by_category}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {mockCharts.expense_by_category.map((_, index) => (
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
              <BarChart data={mockCharts.task_status}>
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
                {mockCharts.recent_activities.map((activity) => (
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
                      <p className="text-sm text-slate-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
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
              <CardTitle className="text-base">
                Chờ làm rõ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    agent: 'Agent Phân tích',
                    question: 'Cần tổng thể chi tiết?',
                  },
                  {
                    agent: 'Agent Email',
                    question: 'Gửi báo cáo hoặc không?',
                  },
                  {
                    agent: 'Agent CRM',
                    question: 'Cập nhật trạng thái sale?',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <p className="text-xs font-medium text-yellow-900 mb-1">
                      {item.agent}
                    </p>
                    <p className="text-sm text-yellow-800">{item.question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
