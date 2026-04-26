import { Agent } from '@/types';
import { Badge } from './Badge';
import { MessageCircle, Pause, Play } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
  onChat?: (agentId: string) => void;
  onTogglePause?: (agentId: string, isPaused: boolean) => void;
}

export const AgentCard = ({
  agent,
  onChat,
  onTogglePause,
}: AgentCardProps) => {
  const statusColors = {
    online: 'bg-green-500',
    sleeping: 'bg-yellow-500',
    offline: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="text-3xl">{agent.emoji}</div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                statusColors[agent.status]
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{agent.name}</h3>
            <p className="text-xs text-slate-600 capitalize">
              {agent.status}
            </p>
          </div>
        </div>
      </div>

      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <Badge key={cap} size="sm" variant="info">
              {cap}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge size="sm" variant="default">
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs text-slate-600">Đang làm</p>
          <p className="text-sm font-semibold text-slate-900">
            {agent.active_tasks}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Hôm nay</p>
          <p className="text-sm font-semibold text-slate-900">
            {agent.completed_today}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Token</p>
          <p className="text-sm font-semibold text-slate-900">
            {Math.floor(agent.tokens_used / 1000)}k
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Nhất định: {formatTimeAgo(agent.last_heartbeat)}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onChat?.(agent.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-deo-accent text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          <MessageCircle size={16} />
          Chat
        </button>
        <button
          onClick={() => onTogglePause?.(agent.id, agent.status === 'online')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            agent.status === 'online'
              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {agent.status === 'online' ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
        </button>
      </div>
    </div>
  );
};
