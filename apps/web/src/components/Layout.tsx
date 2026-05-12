import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useActiveCompany } from '@/lib/active-company';
import { useLiveEvents } from '@/lib/live-events';

export function Layout() {
  const { id } = useActiveCompany();
  useLiveEvents(id);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
