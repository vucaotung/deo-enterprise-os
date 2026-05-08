import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardSummary } from '@/api/client';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  to?: string;
  variant: 'warning' | 'info' | 'success';
};

const numberValue = (...values: unknown[]): number => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

export const Layout = () => {
  const [pageTitle, setPageTitle] = useState('Bảng điều khiển');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const displayName = user?.username || 'User';

  const notificationCount = notifications.length;

  const companies = [
    { id: '1', name: 'Công ty A' },
    { id: '2', name: 'Công ty B' },
    { id: '3', name: 'Tất cả công ty' },
  ];

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const summary: any = await getDashboardSummary();
        const items: NotificationItem[] = [];
        const pendingClarifications = numberValue(summary?.clarifications?.pending, summary?.clarificationCount, summary?.pendingClarifications);
        const openTasks = numberValue(summary?.tasks?.open, summary?.taskCountByStatus?.todo, summary?.taskCount);
        const runningTasks = numberValue(summary?.tasks?.in_progress, summary?.taskCountByStatus?.in_progress);
        const offlineAgents = numberValue(summary?.agents?.offline, summary?.agentCountByStatus?.offline);

        if (pendingClarifications > 0) {
          items.push({
            id: 'clarifications',
            title: `${pendingClarifications} mục chờ làm rõ`,
            description: 'Có yêu cầu cần sếp trả lời để agent chạy tiếp.',
            to: '/clarifications',
            variant: 'warning',
          });
        }

        if (openTasks > 0) {
          items.push({
            id: 'open-tasks',
            title: `${openTasks} task đang mở`,
            description: 'Task chưa được xử lý hoặc chưa phân công xong.',
            to: '/tasks',
            variant: 'info',
          });
        }

        if (runningTasks > 0) {
          items.push({
            id: 'running-tasks',
            title: `${runningTasks} task đang chạy`,
            description: 'Có việc đang trong pipeline xử lý.',
            to: '/tasks',
            variant: 'success',
          });
        }

        if (offlineAgents > 0) {
          items.push({
            id: 'offline-agents',
            title: `${offlineAgents} agent offline`,
            description: 'Có agent không heartbeat, nên kiểm tra nếu cần.',
            to: '/agents',
            variant: 'warning',
          });
        }

        if (Array.isArray(summary?.alerts)) {
          summary.alerts.forEach((alert: any, index: number) => {
            if (!alert?.message) return;
            items.push({
              id: `alert-${index}`,
              title: String(alert.type || 'Cảnh báo'),
              description: String(alert.message),
              variant: 'warning',
            });
          });
        }

        setNotifications(items.slice(0, 8));
      } catch (error) {
        console.error('Failed to load notifications', error);
        setNotifications([
          {
            id: 'notification-error',
            title: 'Không tải được thông báo',
            description: 'API dashboard chưa trả dữ liệu hoặc phiên đăng nhập hết hạn.',
            variant: 'warning',
          },
        ]);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const notificationSummary = useMemo(() => {
    if (notificationCount === 0) return 'Không có thông báo mới';
    return `${notificationCount} thông báo cần chú ý`;
  }, [notificationCount]);

  return (
    <div className="flex h-screen bg-deo-blue">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-16">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Công ty:</label>
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-900 hover:bg-slate-200 transition-colors">
                  {selectedCompany}
                  <ChevronDown size={16} />
                </button>
                <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompany(company.name)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                aria-label="Mở thông báo"
                aria-expanded={isNotificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative text-slate-600 hover:text-slate-900 transition-colors rounded-lg p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-deo-accent"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-deo-orange text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 z-30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="font-semibold text-slate-900">Thông báo</p>
                    <p className="text-xs text-slate-500 mt-0.5">{notificationSummary}</p>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationCount === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        Êm ru. Không có gì réo sếp lúc này.
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const dotClass = item.variant === 'warning' ? 'bg-amber-500' : item.variant === 'success' ? 'bg-green-500' : 'bg-blue-500';
                        const content = (
                          <div className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-900">{item.title}</span>
                              <span className="block text-xs text-slate-500 mt-1 leading-5">{item.description}</span>
                            </span>
                          </div>
                        );

                        return item.to ? (
                          <Link key={item.id} to={item.to} onClick={() => setNotificationsOpen(false)} className="block border-b border-slate-100 last:border-b-0">
                            {content}
                          </Link>
                        ) : (
                          <div key={item.id} className="border-b border-slate-100 last:border-b-0">
                            {content}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-deo-accent rounded-full flex items-center justify-center text-sm font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{displayName}</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-8">
          <Outlet context={{ setPageTitle }} />
        </main>
      </div>
    </div>
  );
};
