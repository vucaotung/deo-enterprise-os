import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import type { Approval } from '@/types';
import { getApprovals, decideApproval } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const statusVariantMap: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  expired: 'default',
  cancelled: 'default',
};

export const Approvals = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [deciding, setDeciding] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    setPageTitle('Approvals');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        const data = await getApprovals({ status: filter || undefined });
        setApprovals(data);
      } catch (err) {
        console.error('Failed to fetch approvals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, [filter]);

  const handleDecide = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const updated = await decideApproval(id, { status, decision_note: note || undefined });
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setDeciding(null);
      setNote('');
    } catch (err) {
      console.error('Failed to decide:', err);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Total approvals</p>
            <p className="text-2xl font-bold text-slate-900">{approvals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Decided</p>
            <p className="text-2xl font-bold text-green-600">{approvals.length - pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Approval Queue</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Review and decide on pending approval requests.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  filter === s.value
                    ? 'bg-deo-accent text-white border-deo-accent'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Loading approvals...</h3>
            </div>
          ) : approvals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <ShieldCheck size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">No approvals found</h3>
              <p className="text-sm text-slate-600 mt-2">
                Approval requests will appear here when created.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusVariantMap[a.status] || 'default'} size="sm">
                          {a.status}
                        </Badge>
                        <span className="text-xs text-slate-400 uppercase font-medium">
                          {a.entity_type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {a.entity_title || a.entity_id}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested by: {a.requester?.display_name || '-'} &middot; Assigned to:{' '}
                        {a.assignee?.display_name || '-'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(a.created_at).toLocaleString('vi-VN')}
                        {a.decided_at && (
                          <span>
                            {' '}
                            &middot; Decided: {new Date(a.decided_at).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </p>
                      {a.decision_note && (
                        <p className="text-sm text-slate-600 mt-2 italic bg-slate-50 rounded-lg px-3 py-2">
                          "{a.decision_note}"
                        </p>
                      )}
                    </div>

                    {a.status === 'pending' && (
                      <div>
                        {deciding === a.id ? (
                          <div className="space-y-2 w-64">
                            <textarea
                              rows={2}
                              placeholder="Note (optional)..."
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deo-accent focus:border-transparent"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDecide(a.id, 'approved')}
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecide(a.id, 'rejected')}
                                className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setDeciding(null);
                                  setNote('');
                                }}
                                className="px-3 py-2 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeciding(a.id)}
                            className="px-4 py-2 text-sm font-medium text-deo-accent border border-cyan-200 rounded-lg hover:bg-cyan-50 transition-colors"
                          >
                            Decide
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
