import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, Bot, User } from 'lucide-react';
import type { Worker } from '@/types';
import { getWorkers } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

export const Workers = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Worker | null>(null);

  useEffect(() => {
    setPageTitle('Workers');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        const data = await getWorkers({
          worker_type: typeFilter || undefined,
          search: search || undefined,
        });
        setWorkers(data);
      } catch (err) {
        console.error('Failed to fetch workers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, [typeFilter, search]);

  const humanCount = workers.filter(w => w.worker_type === 'human').length;
  const aiCount = workers.filter(w => w.worker_type === 'ai').length;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Total workers</p>
            <p className="text-2xl font-bold text-slate-900">{workers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Human</p>
            <p className="text-2xl font-bold text-cyan-600">{humanCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">AI Agents</p>
            <p className="text-2xl font-bold text-purple-600">{aiCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Worker Hub</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Unified view of human and AI workers across the system.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="relative w-full lg:max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deo-accent focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {[
                { value: '', label: 'All' },
                { value: 'human', label: 'Human' },
                { value: 'ai', label: 'AI' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    typeFilter === t.value
                      ? 'bg-deo-accent text-white border-deo-accent'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Loading workers...</h3>
            </div>
          ) : workers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Users size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">No workers found</h3>
              <p className="text-sm text-slate-600 mt-2">
                Workers will appear here after running PM seed migrations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {workers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(selected?.id === w.id ? null : w)}
                  className={`text-left bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
                    selected?.id === w.id ? 'border-cyan-400 shadow-md' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        w.worker_type === 'ai' ? 'bg-purple-100' : 'bg-cyan-100'
                      }`}
                    >
                      {w.worker_type === 'ai' ? (
                        <Bot size={18} className="text-purple-700" />
                      ) : (
                        <User size={18} className="text-cyan-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{w.display_name}</p>
                      <p className="text-xs text-slate-500">{w.email || w.worker_type}</p>
                    </div>
                    <Badge
                      variant={w.status === 'active' ? 'success' : 'default'}
                      size="sm"
                    >
                      {w.status}
                    </Badge>
                  </div>

                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-cyan-600">{w.active_tasks || 0} active</span>
                    <span className="text-green-600">{w.completed_tasks || 0} done</span>
                  </div>

                  {w.roles && w.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(Array.isArray(w.roles) ? w.roles : []).map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-md"
                        >
                          {String(r).replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail panel */}
      {selected && selected.projects && selected.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selected.display_name}'s Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selected.projects.map((p, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-b-0">
                  <span className="text-slate-900">
                    {p.project_name} <span className="text-slate-400">({p.project_code})</span>
                  </span>
                  <Badge variant="info" size="sm">
                    {p.membership_role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
