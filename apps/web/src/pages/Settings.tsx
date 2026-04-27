import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { changePassword } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

export const Settings = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const { user } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => setPageTitle('Cài đặt cá nhân'), [setPageTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (next.length < 8) {
      setError('Mật khẩu mới phải ≥ 8 ký tự.');
      return;
    }
    if (next !== next2) {
      setError('Hai mật khẩu mới không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(current, next);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setNext2('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Đổi mật khẩu thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Hồ sơ</h2>
        <p className="text-sm text-slate-600 mb-4">Thông tin tài khoản hiện tại</p>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <dt className="text-slate-600">Email</dt>
          <dd className="col-span-2 font-medium text-slate-900">{user?.email}</dd>
          <dt className="text-slate-600">Họ tên</dt>
          <dd className="col-span-2 font-medium text-slate-900">{user?.name || user?.username || '—'}</dd>
          <dt className="text-slate-600">Vai trò</dt>
          <dd className="col-span-2 font-medium text-slate-900">{user?.role || '—'}</dd>
        </dl>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Đổi mật khẩu</h2>
        <p className="text-sm text-slate-600 mb-4">
          Nhập mật khẩu hiện tại và mật khẩu mới. Mật khẩu phải ≥ 8 ký tự.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            Đổi mật khẩu thành công. Phiên đăng nhập hiện tại vẫn hợp lệ.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Mật khẩu mới (≥ 8 ký tự)</label>
            <input
              type="password"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Nhập lại mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={8}
              value={next2}
              onChange={(e) => setNext2(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-deo-accent hover:bg-cyan-600 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-lg"
          >
            {submitting ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};
