import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { User, Lock, Building2, FolderKanban, CheckSquare, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile, changePassword, getMemberships } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Chủ sở hữu',
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  staff: 'Nhân viên',
  viewer: 'Người xem',
};

const ROLE_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  owner: 'success',
  admin: 'warning',
  manager: 'info',
  staff: 'default',
  viewer: 'default',
};

export const Profile = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [memberships, setMemberships] = useState<{
    companies: any[];
    projects: any[];
    tasks: any[];
  }>({ companies: [], projects: [], tasks: [] });
  const [loadingMemberships, setLoadingMemberships] = useState(true);

  useEffect(() => {
    setPageTitle('Hồ sơ cá nhân');
  }, [setPageTitle]);

  useEffect(() => {
    getMemberships()
      .then(setMemberships)
      .catch(() => {})
      .finally(() => setLoadingMemberships(false));
  }, []);

  const displayName = (user as any)?.full_name || user?.username || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updates: Record<string, string> = {};
      if (fullName.trim()) updates.full_name = fullName.trim();
      if (department.trim()) updates.department = department.trim();
      await updateProfile(updates);
      setProfileMsg({ type: 'success', text: 'Cập nhật thành công' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Cập nhật thất bại' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới không khớp' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải ít nhất 8 ký tự' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Đổi mật khẩu thất bại';
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-deo-accent rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{displayName}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={displayName}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bộ phận / Chức năng</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="VD: Kinh doanh, Kỹ thuật..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
              />
            </div>
          </div>

          {profileMsg && (
            <p className={`text-sm ${profileMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {profileMsg.text}
            </p>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="flex items-center gap-2 bg-deo-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={18} />
            Bảo mật
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deo-accent"
              />
            </div>
          </div>

          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {passwordMsg.text}
            </p>
          )}

          <button
            onClick={handleChangePassword}
            disabled={passwordSaving || !oldPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 bg-deo-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Lock size={14} />
            {passwordSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </CardContent>
      </Card>

      {/* Companies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={18} />
            Công ty đang tham gia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMemberships ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : memberships.companies.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa tham gia công ty nào</p>
          ) : (
            <ul className="space-y-2">
              {memberships.companies.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-900">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={ROLE_VARIANTS[c.role] || 'default'}>
                      {ROLE_LABELS[c.role] || c.role}
                    </Badge>
                    {!c.is_active && (
                      <Badge variant="default">Không hoạt động</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban size={18} />
            Projects đang tham gia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMemberships ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : memberships.projects.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa tham gia project nào</p>
          ) : (
            <ul className="space-y-2">
              {memberships.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/projects/${p.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-900">{p.name}</span>
                    <Badge variant={p.status === 'active' ? 'success' : 'default'}>
                      {p.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* My Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare size={18} />
            Công việc đang thực hiện
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMemberships ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : memberships.tasks.length === 0 ? (
            <p className="text-sm text-slate-500">Không có công việc nào đang thực hiện</p>
          ) : (
            <ul className="space-y-2">
              {memberships.tasks.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/tasks/${t.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{t.title}</p>
                      {t.project_name && (
                        <p className="text-xs text-slate-500 mt-0.5">{t.project_name}</p>
                      )}
                    </div>
                    <Badge variant={t.status === 'in_progress' ? 'info' : 'default'}>
                      {t.status === 'in_progress' ? 'Đang làm' : 'Chờ'}
                    </Badge>
                  </Link>
                </li>
              ))}
              {memberships.tasks.length === 20 && (
                <li>
                  <Link to="/tasks" className="text-sm text-deo-accent hover:underline">
                    Xem tất cả →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
