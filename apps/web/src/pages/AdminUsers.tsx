import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  listUsers,
  listInvites,
  createInvite,
  revokeInvite,
  updateUser,
  disableUser,
  type AdminUser,
  type Invite,
} from '@/api/client';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Copy, Check, AlertTriangle } from 'lucide-react';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

type Role = 'admin' | 'manager' | 'staff' | 'agent_handler';

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Quản lý',
  staff: 'Nhân viên',
  agent_handler: 'Xử lý Agent',
};

export const AdminUsers = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('staff');
  const [inviteSubmit, setInviteSubmit] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState('');
  const [lastInviteEmailSent, setLastInviteEmailSent] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setPageTitle('Tài khoản'), [setPageTitle]);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, i] = await Promise.all([listUsers(), listInvites()]);
      setUsers(u);
      setInvites(i);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Tải dữ liệu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmit(true);
    try {
      const result = await createInvite({
        email: inviteEmail,
        full_name: inviteName || undefined,
        role: inviteRole,
      });
      setLastInviteUrl(result.invite_url);
      setLastInviteEmailSent(result.email.delivered);
      setInviteEmail('');
      setInviteName('');
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Tạo lời mời thất bại.');
    } finally {
      setInviteSubmit(false);
    }
  };

  const handleCopy = async () => {
    if (!lastInviteUrl) return;
    await navigator.clipboard.writeText(lastInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (id: string, role: Role) => {
    await updateUser(id, { role });
    await refresh();
  };

  const handleToggleActive = async (u: AdminUser) => {
    await updateUser(u.id, { is_active: !u.is_active });
    await refresh();
  };

  const handleDisable = async (id: string) => {
    if (!confirm('Vô hiệu hóa tài khoản này?')) return;
    await disableUser(id);
    await refresh();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Thu hồi lời mời này?')) return;
    await revokeInvite(id);
    await refresh();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tài khoản công ty</h2>
          <p className="text-sm text-slate-600">Mời thành viên mới qua email và quản lý vai trò.</p>
        </div>
        <button
          onClick={() => {
            setShowInviteModal(true);
            setLastInviteUrl('');
            setLastInviteEmailSent(null);
          }}
          className="bg-deo-accent hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus size={16} /> Mời thành viên
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="text-red-600 mt-0.5" size={16} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Thành viên ({users.length})</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-xs text-slate-600">
            <tr>
              <th className="px-6 py-2">Email</th>
              <th className="px-6 py-2">Họ tên</th>
              <th className="px-6 py-2">Vai trò</th>
              <th className="px-6 py-2">Đăng nhập gần nhất</th>
              <th className="px-6 py-2">Trạng thái</th>
              <th className="px-6 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Đang tải...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Chưa có thành viên</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 text-sm">{u.email}</td>
                  <td className="px-6 py-3 text-sm">{u.full_name || '—'}</td>
                  <td className="px-6 py-3">
                    {isAdmin ? (
                      <select
                        value={u.company_role || 'staff'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        disabled={u.id === user?.id}
                        className="text-sm border border-slate-300 rounded px-2 py-1"
                      >
                        {(['admin', 'manager', 'staff', 'agent_handler'] as const).map((r) => (
                          <option key={r} value={r}>{roleLabels[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="info">{roleLabels[u.company_role] || u.company_role}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString('vi-VN') : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={u.is_active ? 'success' : 'default'}>
                      {u.is_active ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-right text-sm space-x-2">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="text-deo-accent hover:underline"
                      >
                        {u.is_active ? 'Khóa' : 'Mở khóa'}
                      </button>
                    )}
                    {isAdmin && u.id !== user?.id && (
                      <button onClick={() => handleDisable(u.id)} className="text-red-600 hover:underline">
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Lời mời ({invites.length})</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-xs text-slate-600">
            <tr>
              <th className="px-6 py-2">Email</th>
              <th className="px-6 py-2">Vai trò</th>
              <th className="px-6 py-2">Tạo bởi</th>
              <th className="px-6 py-2">Hết hạn</th>
              <th className="px-6 py-2">Trạng thái</th>
              <th className="px-6 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Chưa có lời mời nào</td></tr>
            ) : (
              invites.map((i) => {
                const isExpired = !i.used_at && new Date(i.expires_at) < new Date();
                return (
                  <tr key={i.id} className="border-t border-slate-100">
                    <td className="px-6 py-3 text-sm">{i.email}</td>
                    <td className="px-6 py-3 text-sm">{roleLabels[i.role] || i.role}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{i.created_by_email || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {new Date(i.expires_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-3">
                      {i.used_at ? (
                        <Badge variant="success">Đã dùng</Badge>
                      ) : isExpired ? (
                        <Badge variant="error">Hết hạn</Badge>
                      ) : (
                        <Badge variant="info">Đang chờ</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right text-sm">
                      {!i.used_at && !isExpired && (
                        <button onClick={() => handleRevoke(i.id)} className="text-red-600 hover:underline">
                          Thu hồi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Mời thành viên mới">
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Họ tên (tùy chọn)</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Vai trò</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent"
            >
              {(['staff', 'manager', 'agent_handler', ...(isAdmin ? ['admin'] as const : [])]).map((r) => (
                <option key={r} value={r}>{roleLabels[r as Role]}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={inviteSubmit}
            className="w-full bg-deo-accent hover:bg-cyan-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg"
          >
            {inviteSubmit ? 'Đang tạo lời mời...' : 'Tạo lời mời'}
          </button>

          {lastInviteUrl && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">
                {lastInviteEmailSent ? 'Đã gửi email' : 'SMTP chưa cấu hình — gửi link thủ công cho thành viên'}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white border border-slate-200 rounded px-2 py-1 flex-1 truncate">
                  {lastInviteUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 hover:bg-slate-200 rounded"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
