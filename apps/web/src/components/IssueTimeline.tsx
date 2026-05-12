import { Bot, UserRound, Play } from 'lucide-react';
import type { TimelineItem } from '@/pages/IssueDetail';

export function IssueTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm italic text-slate-400">
        Chưa có hoạt động. Gửi bình luận để bắt đầu.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => {
        if (item.kind === 'comment' && item.comment) {
          const c = item.comment;
          const isAgent = c.authorType === 'agent';
          return (
            <li
              key={item.key}
              className={`rounded-lg border p-3 text-sm ${
                isAgent ? 'border-blue-100 bg-blue-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                {isAgent ? (
                  <Bot className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <UserRound className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span
                  className={`font-medium ${
                    isAgent ? 'text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {c.authorDisplay || c.authorId}
                </span>
                <span>•</span>
                <time dateTime={c.createdAt}>{formatAt(c.createdAt)}</time>
              </div>
              <p className="whitespace-pre-wrap text-slate-800">{c.body}</p>
            </li>
          );
        }

        if (item.kind === 'run' && item.run) {
          const r = item.run;
          return (
            <li
              key={item.key}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
            >
              <Play className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono">{r.id.slice(0, 8)}</span>
              <span>·</span>
              <span className="font-medium">{r.status}</span>
              <span className="ml-auto text-slate-400">
                {formatAt(r.startedAt ?? '')}
              </span>
            </li>
          );
        }
        return null;
      })}
    </ol>
  );
}

function formatAt(iso: string) {
  if (!iso) return '';
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
}
