import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Lead } from '@/types';
import { Badge } from '@/components/Badge';
import { SlidePanel } from '@/components/SlidePanel';
import { FallbackBanner } from '@/components/FallbackBanner';
import { Plus } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { useApiWithFallback } from '@/hooks/useApiWithFallback';
import { getLeads } from '@/api/client';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockLeads: Lead[] = [
  {
    id: '1',
    client_id: 'c1',
    status: 'NEW',
    source: 'Website',
    score: 85,
    assigned_to: 'u1',
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'c1',
      name: 'Công ty ABC',
      email: 'contact@abc.com',
      phone: '0901234567',
      company: 'ABC Corp',
      company_id: 'c1',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    assignee: {
      id: 'u1',
      email: 'user1@company.com',
      name: 'Trần Thị B',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '2',
    client_id: 'c2',
    status: 'CONTACTED',
    source: 'Email',
    score: 72,
    assigned_to: 'u2',
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'c2',
      name: 'Công ty XYZ',
      email: 'info@xyz.com',
      phone: '0912345678',
      company: 'XYZ Inc',
      company_id: 'c1',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: '3',
    client_id: 'c3',
    status: 'QUALIFIED',
    source: 'Referral',
    score: 90,
    assigned_to: 'u1',
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'c3',
      name: 'Công ty 123',
      email: 'hello@123.com',
      phone: '0923456789',
      company: '123 Group',
      company_id: 'c1',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: '4',
    client_id: 'c4',
    status: 'PROPOSAL',
    source: 'Cold Call',
    score: 65,
    assigned_to: 'u3',
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'c4',
      name: 'Công ty DEF',
      email: 'contact@def.com',
      phone: '0934567890',
      company: 'DEF Ltd',
      company_id: 'c1',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: '5',
    client_id: 'c5',
    status: 'WON',
    source: 'Website',
    score: 95,
    assigned_to: 'u2',
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'c5',
      name: 'Công ty GHI',
      email: 'sales@ghi.com',
      phone: '0945678901',
      company: 'GHI Corp',
      company_id: 'c1',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: '6',
    client_id: 'c6',
    status: 'LOST',
    source: 'Advertisement',
    score: 40,
    assigned_to: 'u1',
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'c6',
      name: 'Công ty JKL',
      email: 'info@jkl.com',
      phone: '0956789012',
      company: 'JKL Industries',
      company_id: 'c1',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

export const CRM = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { items: leads, usingFallback } = useApiWithFallback<Lead>(getLeads, mockLeads);

  useEffect(() => {
    setPageTitle('CRM');
  }, [setPageTitle]);

  const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];
  const statusLabels: Record<string, string> = {
    'NEW': 'Mới',
    'CONTACTED': 'Đã liên hệ',
    'QUALIFIED': 'Hợp lệ',
    'PROPOSAL': 'Đề xuất',
    'WON': 'Thắng',
    'LOST': 'Mất',
  };

  const pipelineLeads = statuses.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<string, Lead[]>
  );

  return (
    <div className="space-y-6">
      <FallbackBanner visible={usingFallback} />
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">
          Đường ống bán hàng
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors">
          <Plus size={16} />
          Khách hàng mới
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-slate-100 rounded-lg p-4 min-h-96">
              <h3 className="font-semibold text-slate-900 mb-4">
                {statusLabels[status]} ({pipelineLeads[status].length})
              </h3>

              <div className="space-y-3">
                {pipelineLeads[status].map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="w-full text-left bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900">
                        {lead.client?.name}
                      </h4>
                      <Badge variant="info" size="sm">
                        {lead.score}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">
                      Từ: {lead.source}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lead.assignee?.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Danh sách khách hàng</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Điện thoại
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Công ty
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Điểm
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {lead.client?.name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {lead.client?.email}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {lead.client?.phone}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {lead.client?.company}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {lead.score}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.client?.name || ''}
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">
                Thông tin khách hàng
              </h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-slate-600">Email:</span>{' '}
                  {selectedLead.client?.email}
                </p>
                <p className="text-sm">
                  <span className="text-slate-600">Điện thoại:</span>{' '}
                  {selectedLead.client?.phone}
                </p>
                <p className="text-sm">
                  <span className="text-slate-600">Công ty:</span>{' '}
                  {selectedLead.client?.company}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-2">Trạng thái</p>
                <Badge className={getStatusColor(selectedLead.status)}>
                  {getStatusLabel(selectedLead.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-2">Điểm số</p>
                <p className="text-2xl font-bold text-deo-accent">
                  {selectedLead.score}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-2">Nguồn</p>
              <p className="text-sm text-slate-900">{selectedLead.source}</p>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-2">Gán cho</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-deo-accent rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {selectedLead.assignee?.name?.charAt(0)}
                </div>
                <p className="text-sm text-slate-900">
                  {selectedLead.assignee?.name}
                </p>
              </div>
            </div>

            <button className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors">
              Chỉnh sửa lead
            </button>
          </div>
        )}
      </SlidePanel>
    </div>
  );
};
