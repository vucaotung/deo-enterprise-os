import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, UserCircle, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import {
  getDashboardSummary,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from '@/api/client';
import { getSocket, initSocket } from '@/lib/socket';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  to?: string;
  variant: 'warning' | 'info' | 'success';
  unread?: boolean;
  isReal?: boolean;
};

const variantForType = (type: NotificationRow['type']): NotificationItem['variant'] => {
  if (type === 'mention' || type === 'review_required') return 'warning';
  if (type === 'agent_update' || type === 'job_done') return 'success';
  return 'info';
};

const mapRowToItem = (row: NotificationRow): NotificationItem => ({
  id: row.id,
  title: row.title,
  description: row.body || '',
  to: row.link || undefined,
  variant: variantForType(row.type),
  unread: row.read_at === null,
  isReal: true,
});

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
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.username || 'User';

  const notificationCount = notifications.filter((n) => n.unread !== false).length;

  const companies = [
    { id: '1', name: 'Công ty A' },
    { id: '2', name: 'Công ty B' },
    { id: '3', name: 'Tất cả công ty' },
  ];

  const buildDashboardAlerts = useCallback(async (): Promise<NotificationItem[]> => {
    try {
      const summary = await getDashboardSummary();
      const items: NotificationItem[] = [];
      const pendingClarifications = numberValue(summary.clarifications?.pending);
      const offlineAgents = numberValue(summary.agents?.offline);

      if (pendingClarifications > 0) {
        items.push({
          id: 'dash-clarifications',
          title: `${pendingClarifications} mục chờ làm rõ`,
          description: 'Có yêu cầu cần sếp trả lời để agent chạy tiếp.',
          to: '/clarifications',
          variant: 'warning',
        });
      }
      if (offlineAgents > 0) {
        items.push({
          id: 'dash-offline-agents',
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
            id: `dash-alert-${index}`,
            title: String(alert.type || 'Cảnh báo'),
            description: String(alert.message),
            variant: 'warning',
          });
        });
      }
      return items;
    } catch (error) {
      console.error('Failed to load dashboard alerts', error);
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      try {
        const [rows, dashItems] = await Promise.all([
          getNotifications({ limit: 50 }).catch(() => [] as NotificationRow[]),
          buildDashboardAlerts(),
        ]);
        if (cancelled) return;
        const real = rows.map(mapRowToItem);
        const seen = new Set(real.map((i) => i.id));
        const merged = [...real, ...dashItems.filter((i) => !seen.has(i.id))];
        setNotifications(merged.slice(0, 50));
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };
    void loadAll();
    const interval = window.setInterval(loadAll, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [buildDashboardAlerts]);

  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
    const socket = getSocket() || initSocket(token);
    socket.emit('join-user-room', user.id);
    const onNotification = (row: NotificationRow) => {
      setNotifications((prev) => {
        const item = mapRowToItem(row);
        if (prev.some((p) => p.id === item.id)) return prev;
        return [item, ...prev].slice(0, 50);
      });
    };
    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [user?.id]);

  const handleNotificationClick = useCallback(
    async (item: NotificationItem) => {
      setNotificationsOpen(false);
      if (item.isReal && item.unread) {
        try {
          await markNotificationRead(item.id);
          setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)));
        } catch (error) {
          console.error('mark read failed', error);
        }
      }
      if (item.to) navigate(item.to);
    },
    [navigate]
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => (n.isReal ? { ...n, unread: false } : n)));
    } catch (error) {
      console.error('mark all read failed', error);
    }
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
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
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-900">Thông báo</p>
                      <p className="text-xs text-slate-500 mt-0.5">{notificationSummary}</p>
                    </div>
                    {notificationCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-deo-accent hover:underline"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        Êm ru. Không có gì réo sếp lúc này.
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const dotClass = item.variant === 'warning' ? 'bg-amber-500' : item.variant === 'success' ? 'bg-green-500' : 'bg-blue-500';
                        const unread = item.unread !== false;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                              unread ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <span className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
                            <span className="min-w-0 flex-1">
                              <span className={`block text-sm ${unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{item.title}</span>
                              {item.description && (
                                <span className="block text-xs text-slate-500 mt-1 leading-5">{item.description}</span>
                              )}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-deo-accent rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{displayName}</span>
                <ChevronDown size={16} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserCircle size={15} />
                    Hồ sơ cá nhân
                  </button>
                  <hr className="my-1 border-slate-100" />
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-8">
          <Outlet context={{ setPageTitle }} />
        </main>
      </div>
    </div>
  );
};
