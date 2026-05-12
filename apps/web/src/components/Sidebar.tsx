import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  FolderKanban,
  ListChecks,
  ShieldCheck,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { CompanySwitcher } from './CompanySwitcher';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/issues', label: 'Issues', icon: ListChecks },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/agents', label: 'Agents', icon: Bot },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Worker Console
        </div>
        <CompanySwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-deo-accent/10 text-deo-accent'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
        <a
          href="http://localhost:3100"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 hover:text-slate-800"
        >
          Paperclip UI <ExternalLink className="h-3 w-3" />
        </a>
        <p className="mt-1 text-[11px] text-slate-400">
          Adapters, secrets, workspace controls live there.
        </p>
      </div>
    </aside>
  );
}
