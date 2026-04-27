import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Notebook } from '@/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { SlidePanel } from '@/components/SlidePanel';
import { FallbackBanner } from '@/components/FallbackBanner';
import { Plus, Grid, List as ListIcon } from 'lucide-react';
import { formatDate, formatTimeAgo } from '@/lib/utils';
import { useApiWithFallback } from '@/hooks/useApiWithFallback';
import { getNotebooks } from '@/api/client';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockNotebooks: Notebook[] = [
  {
    id: '1',
    title: 'Chiến lược tiếp thị tháng 4',
    content: '# Chiến lược tiếp thị tháng 4\n\n## Mục tiêu\n- Tăng khách hàng mới 20%\n- Xây dựng brand awareness\n- Tối ưu hóa chi phí quảng cáo\n\n## Kế hoạch hành động\n1. Facebook Ads: 5M đ\n2. Google Ads: 3M đ\n3. Email campaign\n4. Content marketing\n\n## Đo lường\n- Traffic tăng 25%\n- Conversion rate: 3.5%\n- ROI > 300%',
    type: 'knowledge',
    project_id: 'p1',
    created_by: 'u1',
    company_id: 'c1',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    creator: {
      id: 'u1',
      email: 'user1@company.com',
      name: 'Trần Thị B',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '2',
    title: 'Hội nghị nội bộ - 15/04/2026',
    content: '# Hội nghị nội bộ\n\n**Thời gian:** 15/04/2026\n**Địa điểm:** Phòng họp A\n\n## Nội dung thảo luận\n1. Báo cáo tiến độ Q1\n   - Doanh thu: 150M đ\n   - Chi phí: 80M đ\n   - Lợi nhuận: 70M đ\n\n2. Kế hoạch Q2\n   - Mở rộng thị trường\n   - Tuyển dụng thêm nhân viên\n   - Nâng cấp hệ thống IT\n\n3. Quyết định\n   - Thông qua ngân sách Q2',
    type: 'meeting',
    project_id: 'p1',
    created_by: 'u2',
    company_id: 'c1',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    creator: {
      id: 'u2',
      email: 'user2@company.com',
      name: 'Lê Hoàng C',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '3',
    title: 'Nghiên cứu: Tính năng mới cho sản phẩm',
    content: '# Nghiên cứu tính năng mới\n\n## Khám phá\n- Phỏng vấn 50 khách hàng\n- Phân tích nhu cầu thị trường\n- Đánh giá tính khả thi\n\n## Kết quả\n### Tính năng được yêu cầu nhất\n1. Tích hợp API (80%)\n2. Tối ưu hóa mobile (75%)\n3. Automation workflow (70%)\n\n## Khuyến nghị\n- Ưu tiên tích hợp API\n- Bắt đầu development từ tuần tới\n- Dự toán: 15M đ',
    type: 'research',
    project_id: 'p3',
    created_by: 'u3',
    company_id: 'c1',
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    creator: {
      id: 'u3',
      email: 'user3@company.com',
      name: 'Phạm Hồng D',
      role: 'user',
      company_id: 'c1',
    },
  },
];

const typeLabels: Record<string, string> = {
  'knowledge': 'Kiến thức',
  'meeting': 'Hội họp',
  'research': 'Nghiên cứu',
  'other': 'Khác',
};

export const Notebooks = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { items: notebooks, usingFallback } = useApiWithFallback<Notebook>(getNotebooks, mockNotebooks);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    setPageTitle('Sổ ghi chép');
  }, [setPageTitle]);

  const filteredNotebooks =
    filterType === 'all'
      ? notebooks
      : notebooks.filter((n) => n.type === filterType);

  return (
    <div className="space-y-6">
      <FallbackBanner visible={usingFallback} />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-deo-accent text-white'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            <Grid size={16} />
            Lưới
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-deo-accent text-white'
                : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            <ListIcon size={16} />
            Danh sách
          </button>
        </div>

        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-deo-accent focus:border-transparent"
          >
            <option value="all">Tất cả loại</option>
            <option value="knowledge">Kiến thức</option>
            <option value="meeting">Hội họp</option>
            <option value="research">Nghiên cứu</option>
            <option value="other">Khác</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
          >
            <Plus size={16} />
            Sổ ghi chép mới
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotebooks.map((notebook) => (
            <button
              key={notebook.id}
              onClick={() => setSelectedNotebook(notebook)}
              className="text-left bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900 line-clamp-2">
                  {notebook.title}
                </h3>
              </div>

              <div className="mb-4">
                <Badge
                  variant={
                    notebook.type === 'knowledge'
                      ? 'info'
                      : notebook.type === 'meeting'
                        ? 'warning'
                        : notebook.type === 'research'
                          ? 'success'
                          : 'default'
                  }
                  size="sm"
                >
                  {typeLabels[notebook.type]}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                {notebook.content.substring(0, 100)}...
              </p>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {notebook.creator?.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTimeAgo(notebook.updated_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Tác giả
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Cập nhật
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredNotebooks.map((notebook) => (
                <tr
                  key={notebook.id}
                  onClick={() => setSelectedNotebook(notebook)}
                  className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {notebook.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        notebook.type === 'knowledge'
                          ? 'info'
                          : notebook.type === 'meeting'
                            ? 'warning'
                            : notebook.type === 'research'
                              ? 'success'
                              : 'default'
                      }
                      size="sm"
                    >
                      {typeLabels[notebook.type]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {notebook.creator?.name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {formatTimeAgo(notebook.updated_at)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlidePanel
        isOpen={!!selectedNotebook}
        onClose={() => setSelectedNotebook(null)}
        title={selectedNotebook?.title || ''}
        size="lg"
      >
        {selectedNotebook && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedNotebook.type === 'knowledge'
                    ? 'info'
                    : selectedNotebook.type === 'meeting'
                      ? 'warning'
                      : selectedNotebook.type === 'research'
                        ? 'success'
                        : 'default'
                }
              >
                {typeLabels[selectedNotebook.type]}
              </Badge>
              <span className="text-sm text-slate-600">
                {selectedNotebook.creator?.name}
              </span>
              <span className="text-sm text-slate-500">
                •{' '}
                {formatDate(selectedNotebook.updated_at)}
              </span>
            </div>

            <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm text-slate-700">
                {selectedNotebook.content}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors">
                Chỉnh sửa
              </button>
              <button className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors">
                Sao chép
              </button>
            </div>
          </div>
        )}
      </SlidePanel>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tạo sổ ghi chép"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tiêu đề
            </label>
            <input
              type="text"
              placeholder="Nhập tiêu đề..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Loại
            </label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent">
              <option value="knowledge">Kiến thức</option>
              <option value="meeting">Hội họp</option>
              <option value="research">Nghiên cứu</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Nội dung (Markdown)
            </label>
            <textarea
              placeholder="Nhập nội dung..."
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent font-mono text-sm"
            />
          </div>

          <button
            onClick={() => setShowAddModal(false)}
            className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors"
          >
            Tạo sổ ghi chép
          </button>
        </div>
      </Modal>
    </div>
  );
};
