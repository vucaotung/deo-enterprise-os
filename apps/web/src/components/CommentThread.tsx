import { Bot, UserRound } from 'lucide-react';
import type { TaskComment } from '@/api/client';
import { cn } from '@/lib/utils';

interface CommentThreadProps {
  comments: TaskComment[];
  emptyText?: string;
}

const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const sourceLabel = (s?: string) => {
  if (s === 'telegram') return 'Telegram';
  if (s === 'agent') return 'Agent';
  if (s === 'api') return 'API';
  return null;
};

export const CommentThread = ({ comments, emptyText = 'Chưa có bình luận nào.' }: CommentThreadProps) => {
  if (!comments || comments.length === 0) {
    return <div className="text-sm italic text-slate-400">{emptyText}</div>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((c) => {
        const isAgent = c.author_type === 'agent';
        const indent = c.parent_id ? 'ml-8' : '';
        const src = sourceLabel(c.source);
        return (
          <li
            key={c.id}
            className={cn(
              'rounded-lg border p-3 text-sm',
              indent,
              isAgent ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'
            )}
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              {isAgent ? <Bot className="h-3.5 w-3.5 text-blue-600" /> : <UserRound className="h-3.5 w-3.5 text-slate-500" />}
              <span className={cn('font-medium', isAgent ? 'text-blue-700' : 'text-slate-700')}>
                {c.author_display || c.author_id}
              </span>
              <span>•</span>
              <span>{formatTime(c.created_at)}</span>
              {src && (
                <>
                  <span>•</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                    {src}
                  </span>
                </>
              )}
            </div>
            <p className="whitespace-pre-wrap text-slate-800">{c.content}</p>
          </li>
        );
      })}
    </ul>
  );
};

export default CommentThread;
