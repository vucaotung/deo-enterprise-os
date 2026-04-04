import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Agent } from '@/types';
import { AgentCard } from '@/components/AgentCard';
import { Modal } from '@/components/Modal';
import { Plus } from 'lucide-react';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Phân tích dữ liệu',
    emoji: '📊',
    capabilities: ['Phân tích', 'Báo cáo', 'Dự báo'],
    status: 'online',
    active_tasks: 3,
    completed_today: 7,
    tokens_used: 45000,
    last_heartbeat: new Date(Date.now() - 60000).toISOString(),
    company_id: 'c1',
  },
  {
    id: '2',
    name: 'Email Marketing',
    emoji: '✉️',
    capabilities: ['Email', 'Tiếp thị', 'Theo dõi'],
    status: 'online',
    active_tasks: 2,
    completed_today: 5,
    tokens_used: 32000,
    last_heartbeat: new Date(Date.now() - 120000).toISOString(),
    company_id: 'c1',
  },
  {
    id: '3',
    name: 'Quản lý CRM',
    emoji: '🎯',
    capabilities: ['CRM', 'Lead', 'Khách hàng'],
    status: 'online',
    active_tasks: 4,
    completed_today: 9,
    tokens_used: 58000,
    last_heartbeat: new Date(Date.now() - 180000).toISOString(),
    company_id: 'c1',
  },
  {
    id: '4',
    name: 'Content Writer',
    emoji: '✍️',
    capabilities: ['Viết', 'Chỉnh sửa', 'Sáng tạo'],
    status: 'sleeping',
    active_tasks: 0,
    completed_today: 3,
    tokens_used: 28000,
    last_heartbeat: new Date(Date.now() - 300000).toISOString(),
    company_id: 'c1',
  },
  {
    id: '5',
    name: 'Kỹ sư phần mềm',
    emoji: '💻',
    capabilities: ['Lập trình', 'Debug', 'Test'],
    status: 'online',
    active_tasks: 5,
    completed_today: 8,
    tokens_used: 67000,
    last_heartbeat: new Date(Date.now() - 90000).toISOString(),
    company_id: 'c1',
  },
  {
    id: '6',
    name: 'Quản lý tài chính',
    emoji: '💰',
    capabilities: ['Kế toán', 'Ngân sách', 'Tính toán'],
    status: 'offline',
    active_tasks: 0,
    completed_today: 0,
    tokens_used: 12000,
    last_heartbeat: new Date(Date.now() - 7200000).toISOString(),
    company_id: 'c1',
  },
];

export const Agents = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setPageTitle('Agents');
  }, [setPageTitle]);

  const onlineCount = agents.filter((a) => a.status === 'online').length;
  const sleepingCount = agents.filter((a) => a.status === 'sleeping').length;
  const offlineCount = agents.filter((a) => a.status === 'offline').length;

  const handleChat = (agentId: string) => {
    console.log('Chat with agent:', agentId);
  };

  const handleTogglePause = (agentId: string, isPaused: boolean) => {
    setAgents(
      agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              status: isPaused ? 'sleeping' : 'online',
            }
          : a
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-slate-600">
              Online: {onlineCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-sm text-slate-600">
              Sleeping: {sleepingCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm text-slate-600">
              Offline: {offlineCount}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
        >
          <Plus size={16} />
          Agent mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onChat={handleChat}
            onTogglePause={handleTogglePause}
          />
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tạo Agent mới"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tên Agent
            </label>
            <input
              type="text"
              placeholder="Nhập tên Agent..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Emoji
            </label>
            <input
              type="text"
              placeholder="Chọn emoji..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Khả năng (cách nhau bằng dấu phẩy)
            </label>
            <textarea
              placeholder="Khả năng 1, Khả năng 2, Khả năng 3..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowAddModal(false)}
            className="w-full bg-deo-accent text-white py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors"
          >
            Tạo Agent
          </button>
        </div>
      </Modal>
    </div>
  );
};
