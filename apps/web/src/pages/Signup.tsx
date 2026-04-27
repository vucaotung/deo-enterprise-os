import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getInvite, signup, type InvitePreview } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

export const Signup = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const code = params.get('code') || '';

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!code) {
      setLoadError('Thiếu mã mời. Vui lòng mở link từ email.');
      return;
    }
    getInvite(code)
      .then((preview) => {
        setInvite(preview);
        setFullName(preview.full_name || '');
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) setLoadError('Mã mời không tồn tại.');
        else if (status === 410) setLoadError(err.response.data?.error || 'Mã mời hết hạn hoặc đã dùng.');
        else setLoadError('Không thể tải mã mời. Thử lại sau.');
      });
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (password.length < 8) {
      setSubmitError('Mật khẩu phải dài tối thiểu 8 ký tự.');
      return;
    }
    if (password !== password2) {
      setSubmitError('Hai mật khẩu không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      await signup({ code, password, full_name: fullName || undefined });
      // signup returns a token; reuse the standard login flow to populate context
      if (invite) await login(invite.email, password);
      navigate('/');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || 'Tạo tài khoản thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deo-blue via-deo-dark to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-deo-blue">Tạo tài khoản</h1>
            <p className="text-slate-600 text-sm mt-2">
              Hoàn tất thiết lập tài khoản từ lời mời.
            </p>
          </div>

          {loadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{loadError}</p>
              <Link to="/login" className="text-deo-accent text-sm mt-2 inline-block">
                Quay về đăng nhập
              </Link>
            </div>
          )}

          {invite && !loadError && (
            <>
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                <p>Email: <span className="font-medium">{invite.email}</span></p>
                {invite.company_name && (
                  <p>Công ty: <span className="font-medium">{invite.company_name}</span></p>
                )}
                <p>Vai trò: <span className="font-medium">{invite.role}</span></p>
              </div>

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Mật khẩu (≥ 8 ký tự)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Nhập lại mật khẩu</label>
                  <input
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-deo-accent hover:bg-cyan-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-6"
                >
                  {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                </button>

                <div className="text-center text-sm">
                  <Link to="/login" className="text-deo-accent">Đã có tài khoản? Đăng nhập</Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
