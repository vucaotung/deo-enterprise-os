import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';

export const Layout = () => {
  const [pageTitle, setPageTitle] = useState('Bảng điều khiển');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [notificationCount, setNotificationCount] = useState(3);
  const { user } = useAuth();

  const companies = [
    { id: '1', name: 'Công ty A' },
    { id: '2', name: 'Công ty B' },
    { id: '3', name: 'Tất cả công ty' },
  ];

  return (
    <div className="flex h-screen bg-deo-blue">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-16">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Công ty:</label>
              <div className="relative">
                <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-900 hover:bg-slate-200 transition-colors">
                  {selectedCompany}
                  <ChevronDown size={16} />
                </button>
                <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
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

            <button className="relative text-slate-600 hover:text-slate-900 transition-colors">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-deo-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-deo-accent rounded-full flex items-center justify-center text-sm font-bold text-white">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user?.name}</span>
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
