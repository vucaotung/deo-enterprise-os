import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clarification } from '@/types';
import { Badge } from '@/components/Badge';
import { formatDate, formatTimeAgo } from '@/lib/utils';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockClarifications: Clarification[] = [
  {
    id: '1',
    agent_id: 'a1',
    task_id: 't1',
    question: 'Tôi nên tập trung vào độ chính xác hay tốc độ?',
    context: 'Phân tích dữ liệu: Phân tích xu hướng bán hàng',
    priority: 'high',
    created_at: new Date(Date.now() - 300000).toISOString(),
    company_id: 'c1',
    agent: {
      id: 'a1',
      name: 'Phân tích dữ liệu',
      emoji: '📊',
      capabilities: ['Phân tích', 'Báo cáo'],
      status: 'online',
      active_tasks: 3,
      completed_today: 7,
      tokens_used: 45000,
      last_heartbeat: new Date().toISOString(),
      company_id: 'c1',
    },
    task: {
      id: 't1',
      title: 'Phân tích dữ liệu thị trường',
      description: 'Phân tích xu hướng bán hàng',
      status: 'IN_PROGRESS',
      priority: 'high',
      company_id: 'c1',
      project_id: 'p1',
      assigned_to: 'u1',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_clarification: true,
      clarification_count: 1,
    },
  },
  {
    id: '2',
    agent_id: 'a2',
    task_id: 't2',
    question: 'Tôi có nên gửi email đến toàn bộ danh sách không?',
    context: 'Email Marketing: Chiến dịch quảng cáo tháng 4',
    priority: 'medium',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    company_id: 'c1',
    agent: {
      id: 'a2',
      name: 'Email Marketing',
      emoji: '✉️',
      capabilities: ['Email', 'Tiếp thị'],
      status: 'online',
      active_tasks: 2,
      completed_today: 5,
      tokens_used: 32000,
      last_heartbeat: new Date().toISOString(),
      company_id: 'c1',
    },
  },
  {
    id: '3',
    agent_id: 'a3',
    task_id: 't3',
    question: 'Tôi nên cập nhật trạng thái của những lead nào?',
    context: 'Quản lý CRM: Theo dõi khách hàng tiềm năng',
    priority: 'low',
    answered_at: new Date(Date.now() - 600000).toISOString(),
    answer: 'Hãy cập nhật tất cả lead đã liên hệ nhưng chưa nhận được phản hồi.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    company_id: 'c1',
    agent: {
      id: 'a3',
      name: 'Quản lý CRM',
      emoji: '🎯',
      capabilities: ['CRM', 'Lead'],
      status: 'online',
      active_tasks: 4,
      completed_today: 9,
      tokens_used: 58000,
      last_heartbeat: new Date().toISOString(),
      company_id: 'c1',
    },
  },
  {
    id: '4',
    agent_id: 'a4',
    task_id: 't4',
    question: 'Tôi có nên viết bài blog về điều gì?',
    context: 'Content Writer: Kế hoạch nội dung tháng 4',
    priority: 'medium',
    answered_at: new Date(Date.now() - 1200000).toISOString(),
    answer: 'Viết về "5 xu hướng công nghệ mới năm 2026" dựa trên nhu cầu thị trường hiện tại.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    company_id: 'c1',
    agent: {
      id: 'a4',
      name: 'Content Writer',
      emoji: '✍️',
      capabilities: ['Viết', 'Chỉnh sửa'],
      status: 'sleeping',
      active_tasks: 0,
      completed_today: 3,
      tokens_used: 28000,
      last_heartbeat: new Date().toISOString(),
      company_id: 'c1',
    },
  },
];

export const Clarifications = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [activeTab, setActiveTab] = useState<'pending' | 'answered'>('pending');
  const [clarifications, setClarifications] = useState<Clarification[]>(
    mockClarifications
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setPageTitle('Làm rõ');
  }, [setPageTitle]);

  const pending = clarifications.filter((c) => !c.answered_at);
  const answered = clarifications.filter((c) => c.answered_at);

  const handleSubmitAnswer = (clarificationId: string) => {
    const answer = answers[clarificationId];
    if (!answer.trim()) return;

    setClarifications(
      clarifications.map((c) =>
        c.id === clarificationId
          ? {
              ...c,
              answer,
              answered_at: new Date().toISOString(),
            }
          : c
      )
    );

    setAnswers({
      ...answers,
      [clarificationId]: '',
    });
  };

  const displayClarifications = activeTab === 'pending' ? pending : answered;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-deo-accent text-white'
              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            Chưa trả lời
            {pending.length > 0 && (
              <span className="px-2 py-0.5 bg-deo-orange text-white text-xs font-bold rounded-full">
                {pending.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('answered')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'answered'
              ? 'bg-deo-accent text-white'
              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            Đã trả lời
            {answered.length > 0 && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                {answered.length}
              </span>
            )}
          </span>
        </button>
      </div>

      {displayClarifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">
            {activeTab === 'pending'
              ? 'Không có câu hỏi chưa trả lời'
              : 'Không có câu hỏi nào đã trả lời'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayClarifications.map((clarification) => (
            <div
              key={clarification.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-1">
                    {clarification.agent?.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {clarification.agent?.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {clarification.task?.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      clarification.priority === 'high'
                        ? 'error'
                        : clarification.priority === 'medium'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {clarification.priority}
                  </Badge>
                  {clarification.answered_at ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="text-orange-600" size={20} />
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Câu hỏi:
                </p>
                <p className="text-blue-800">{clarification.question}</p>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                <span className="font-medium">Ngữ cảnh:</span>{' '}
                {clarification.context}
              </p>

              {clarification.answered_at ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Trả lời:
                  </p>
                  <p className="text-green-800">{clarification.answer}</p>
                  <p className="text-xs text-green-600 mt-2">
                    Trả lời {formatTimeAgo(clarification.answered_at)}
                  </p>
                </div>
              ) : (
                <div>
                  <textarea
                    value={answers[clarification.id] || ''}
                    onChange={(e) =>
                      setAnswers({
                        ...answers,
                        [clarification.id]: e.target.value,
                      })
                    }
                    placeholder="Nhập câu trả lời..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-deo-accent focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSubmitAnswer(clarification.id)}
                    disabled={!answers[clarification.id]?.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-deo-accent text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} />
                    Gửi trả lời
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4">
                Hỏi {formatTimeAgo(clarification.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
