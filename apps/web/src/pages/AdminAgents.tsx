import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAgents, rotateAgentToken, getAgentEvents } from '@/api/client';
import { Badge } from '@/components/Badge';
import { Copy, Check, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

interface AgentRow {
  id: string;
  slug?: string;
  name: string;
  display_name?: string;
  status: string;
  last_heartbeat?: string;
  api_token?: string;
}

export const AdminAgents = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [revealedToken, setRevealedToken] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  const [openEvents, setOpenEvents] = useState<string | null>(null);

  useEffect(() => setPageTitle('Quản lý Agent'), [setPageTitle]);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAgents();
      setAgents(data as AgentRow[]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Tải agents thất bại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRotate = async (id: string) => {
    if (!confirm('Tạo lại api_token? Token cũ sẽ ngừng hoạt động ngay.')) return;
    try {
      const result = await rotateAgentToken(id);
      setRevealedToken((prev) => ({ ...prev, [id]: result.api_token }));
      setShowToken((prev) => ({ ...prev, [id]: true }));
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Rotate thất bại.');
    }
  };

  const handleCopy = async (id: string) => {
    const token = revealedToken[id];
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleToggleEvents = async (id: string) => {
    if (openEvents === id) {
      setOpenEvents(null);
      return;
    }
    setOpenEvents(id);
    if (!events[id]) {
      try {
        const data = await getAgentEvents(id, 30);
        setEvents((prev) => ({ ...prev, [id]: data }));
      } catch (_) {
        setEvents((prev) => ({ ...prev, [id]: [] }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Agent — bảo mật & vận hành</h2>
        <p className="text-sm text-slate-600">
          Rotate api_token nếu nghi ngờ rò rỉ. Token mới chỉ hiển thị một lần — copy ngay.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="text-red-600 mt-0.5" size={16} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-xs text-slate-600">
            <tr>
              <th className="px-6 py-2">Slug / Tên</th>
              <th className="px-6 py-2">Trạng thái</th>
              <th className="px-6 py-2">Heartbeat</th>
              <th className="px-6 py-2">API Token</th>
              <th className="px-6 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Đang tải...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Chưa có agent nào</td></tr>
            ) : (
              agents.map((a) => {
                const visibleToken = revealedToken[a.id];
                const tokenShown = showToken[a.id] && visibleToken;
                return (
                  <>
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">{a.slug || a.name}</p>
                        <p className="text-xs text-slate-500">{a.display_name || a.name}</p>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={a.status === 'online' ? 'success' : 'default'}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">
                        {a.last_heartbeat
                          ? new Date(a.last_heartbeat).toLocaleString('vi-VN')
                          : '—'}
                      </td>
                      <td className="px-6 py-3">
                        {visibleToken ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                              {tokenShown ? visibleToken : '••••••••-••••-••••-••••-••••••••••••'}
                            </code>
                            <button
                              onClick={() =>
                                setShowToken((p) => ({ ...p, [a.id]: !p[a.id] }))
                              }
                              className="p-1 hover:bg-slate-200 rounded"
                              title={tokenShown ? 'Ẩn' : 'Hiện'}
                            >
                              {tokenShown ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              onClick={() => handleCopy(a.id)}
                              className="p-1 hover:bg-slate-200 rounded"
                              title="Copy"
                            >
                              {copied === a.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            (Token đang mã hóa — bấm Rotate để tạo mới)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-sm space-x-2">
                        <button
                          onClick={() => handleToggleEvents(a.id)}
                          className="text-deo-accent hover:underline"
                        >
                          {openEvents === a.id ? 'Đóng' : 'Events'}
                        </button>
                        <button
                          onClick={() => handleRotate(a.id)}
                          className="inline-flex items-center gap-1 text-amber-700 hover:underline"
                        >
                          <RefreshCw size={12} /> Rotate
                        </button>
                      </td>
                    </tr>
                    {openEvents === a.id && (
                      <tr key={`${a.id}-events`}>
                        <td colSpan={5} className="bg-slate-50 px-6 py-3 border-t border-slate-100">
                          <div className="text-xs space-y-1 max-h-72 overflow-y-auto font-mono">
                            {(events[a.id] || []).length === 0 ? (
                              <p className="text-slate-500">Chưa có sự kiện.</p>
                            ) : (
                              (events[a.id] || []).map((ev) => (
                                <div key={ev.id} className="flex gap-3">
                                  <span className="text-slate-500 shrink-0">
                                    {new Date(ev.occurred_at).toLocaleTimeString('vi-VN')}
                                  </span>
                                  <span className="font-medium text-slate-800 shrink-0 w-32">
                                    {ev.type}
                                  </span>
                                  <span className="text-slate-600 truncate">
                                    {ev.task_id ? `task=${ev.task_id.slice(0, 8)} ` : ''}
                                    {JSON.stringify(ev.payload)}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
