import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Expense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { FallbackBanner } from '@/components/FallbackBanner';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useApiWithFallback } from '@/hooks/useApiWithFallback';
import { getExpenses } from '@/api/client';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Quảng cáo Facebook',
    amount: 1500000,
    category: 'Tiếp thị',
    account: 'Ngân hàng chính',
    user_id: 'u1',
    company_id: 'c1',
    date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user: {
      id: 'u1',
      email: 'user1@company.com',
      name: 'Trần Thị B',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '2',
    description: 'Tiền lương nhân viên',
    amount: 45000000,
    category: 'Nhân sự',
    account: 'Ngân hàng chính',
    user_id: 'u2',
    company_id: 'c1',
    date: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user: {
      id: 'u2',
      email: 'user2@company.com',
      name: 'Lê Hoàng C',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '3',
    description: 'Cho thuê văn phòng tháng 4',
    amount: 10000000,
    category: 'Vận hành',
    account: 'Ngân hàng chính',
    user_id: 'u1',
    company_id: 'c1',
    date: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    user: {
      id: 'u1',
      email: 'user1@company.com',
      name: 'Trần Thị B',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '4',
    description: 'Mua phần mềm bản quyền',
    amount: 5000000,
    category: 'Công nghệ',
    account: 'Ngân hàng chính',
    user_id: 'u3',
    company_id: 'c1',
    date: new Date(Date.now() - 345600000).toISOString(),
    created_at: new Date(Date.now() - 345600000).toISOString(),
    user: {
      id: 'u3',
      email: 'user3@company.com',
      name: 'Phạm Hồng D',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '5',
    description: 'Chi phí du lịch công tác',
    amount: 8500000,
    category: 'Khác',
    account: 'Ngân hàng chính',
    user_id: 'u2',
    company_id: 'c1',
    date: new Date(Date.now() - 432000000).toISOString(),
    created_at: new Date(Date.now() - 432000000).toISOString(),
    user: {
      id: 'u2',
      email: 'user2@company.com',
      name: 'Lê Hoàng C',
      role: 'user',
      company_id: 'c1',
    },
  },
];

const categoryIcons: Record<string, string> = {
  'Tiếp thị': '📢',
  'Nhân sự': '👥',
  'Vận hành': '⚙️',
  'Công nghệ': '💻',
  'Khác': '📋',
};

export const Finance = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const { items: expenses, usingFallback } = useApiWithFallback<Expense>(getExpenses, mockExpenses);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setPageTitle('Tài chính');
  }, [setPageTitle]);

  const totalIn = 250000000;
  const totalOut = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIn - totalOut;

  const groupedByCategory = expenses.reduce(
    (acc, expense) => {
      const cat = expense.category ?? 'Khác';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(expense);
      return acc;
    },
    {} as Record<string, Expense[]>
  );

  return (
    <div className="space-y-6">
      <FallbackBanner visible={usingFallback} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Tổng thu</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIn)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Tổng chi</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOut)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600 mb-2">Số dư</p>
            <p
              className={`text-2xl font-bold ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chi phí gần đây</CardTitle>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
            >
              <Plus size={16} />
              Thêm chi phí
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Tài khoản
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Người dùng
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {formatDate(expense.date)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {expense.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>
                          {categoryIcons[expense.category ?? ''] || '📋'}
                        </span>
                        <p className="text-sm text-slate-600">
                          {expense.category}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(expense.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {expense.account}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {expense.user?.name}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>{categoryIcons[category] || '📋'}</span>
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 mb-2">
                {formatCurrency(items.reduce((sum, e) => sum + e.amount, 0))}
              </p>
              <p className="text-xs text-slate-600">
                {items.length} giao dịch
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm chi phí"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Mô tả
            </label>
            <input
              type="text"
              placeholder="Mô tả chi phí..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Số tiền
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Danh mục
              </label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent">
                <option>Tiếp thị</option>
                <option>Nhân sự</option>
                <option>Vận hành</option>
                <option>Công nghệ</option>
                <option>Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tài khoản
            </label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent">
              <option>Ngân hàng chính</option>
              <option>Tiền mặt</option>
              <option>Tài khoản phụ</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(false)}
            className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors"
          >
            Thêm chi phí
          </button>
        </div>
      </Modal>
    </div>
  );
};
