import { Client, Task, Agent } from '@/types';
import { Badge } from './Badge';
import { formatDate } from '@/lib/utils';

interface ContextPanelProps {
  client?: Client;
  task?: Task;
  agent?: Agent;
}

export const ContextPanel = ({ client, task, agent }: ContextPanelProps) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 h-full overflow-y-auto scrollbar-thin">
      <h3 className="font-semibold text-slate-900 mb-4">Thông tin liên quan</h3>

      {client && (
        <div className="mb-6 pb-6 border-b border-slate-200">
          <h4 className="font-medium text-slate-800 mb-2">Khách hàng</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-slate-600">Tên:</span> {client.name}
            </p>
            <p className="text-sm">
              <span className="text-slate-600">Email:</span> {client.email}
            </p>
            <p className="text-sm">
              <span className="text-slate-600">Điện thoại:</span> {client.phone}
            </p>
            <p className="text-sm">
              <span className="text-slate-600">Công ty:</span> {client.company}
            </p>
          </div>
        </div>
      )}

      {task && (
        <div className="mb-6 pb-6 border-b border-slate-200">
          <h4 className="font-medium text-slate-800 mb-2">Công việc</h4>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">{task.title}</p>
            <div className="flex gap-2">
              <Badge
                variant={
                  task.status === 'completed'
                    ? 'success'
                    : task.status === 'in_progress'
                      ? 'info'
                      : 'warning'
                }
              >
                {task.status}
              </Badge>
              <Badge
                variant={
                  task.priority === 'high'
                    ? 'error'
                    : task.priority === 'medium'
                      ? 'warning'
                      : 'info'
                }
              >
                {task.priority}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Hạn: {task.due_date ? formatDate(task.due_date) : '—'}
            </p>
          </div>
        </div>
      )}

      {agent && (
        <div>
          <h4 className="font-medium text-slate-800 mb-2">Agent</h4>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {agent.emoji} {agent.name}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  agent.status === 'online'
                    ? 'bg-green-500'
                    : agent.status === 'sleeping'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-slate-600 capitalize">
                {agent.status}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-slate-600">
                Công việc đang làm: {agent.active_tasks}
              </p>
              <p className="text-xs text-slate-600">
                Hoàn thành hôm nay: {agent.completed_today}
              </p>
              <p className="text-xs text-slate-600">
                Token sử dụng: {agent.tokens_used}
              </p>
            </div>
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Khả năng:
                </p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} size="sm" variant="info">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!client && !task && !agent && (
        <p className="text-sm text-slate-500">
          Chọn một cuộc trò chuyện để xem thông tin liên quan
        </p>
      )}
    </div>
  );
};
