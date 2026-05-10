import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  DollarSign,
  Zap,
  BookOpen,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const displayName = (user as any)?.full_name || user?.username || 'User';

  const navItems = [
    { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/' },
    { icon: CheckSquare, label: 'Công việc', path: '/tasks' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: Users, label: 'CRM', path: '/crm' },
    { icon: DollarSign, label: 'Tài chính', path: '/finance' },
    { icon: Zap, label: 'Agents', path: '/agents' },
    { icon: BookOpen, label: 'Sổ ghi chép', path: '/notebooks' },
  ];

  return (
    <>
      <nav
        className={`fixed left-0 top-0 bottom-0 bg-deo-dark text-white transition-all duration-300 z-40 ${
          isExpanded ? 'w-60' : 'w-16'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            {isExpanded && <span className="text-xl font-bold">Dẹo</span>}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-slate-700 p-1 rounded transition-colors"
            >
              {isExpanded ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ul className="p-4 space-y-2">
              {navItems.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-deo-accent text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`
                    }
                    title={label}
                  >
                    <Icon size={20} />
                    {isExpanded && <span className="text-sm">{label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-700 p-4 space-y-2">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              title="Hồ sơ cá nhân"
            >
              <div className="w-6 h-6 bg-deo-accent rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {isExpanded && (
                <span className="text-sm truncate">{displayName}</span>
              )}
            </button>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={20} />
              {isExpanded && <span className="text-sm">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`transition-all duration-300 ${
          isExpanded ? 'ml-60' : 'ml-16'
        }`}
      />
    </>
  );
};
