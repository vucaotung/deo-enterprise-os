import { KeyboardEvent, useState } from 'react';
import { Send } from 'lucide-react';

interface CommentComposerProps {
  onSubmit: (body: string) => Promise<unknown>;
  placeholder?: string;
  disabled?: boolean;
}

export function CommentComposer({
  onSubmit,
  placeholder = 'Viết bình luận. (Ctrl+Enter để gửi)',
  disabled,
}: CommentComposerProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSubmit(trimmed);
      setValue('');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled || sending}
        rows={3}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-deo-accent focus:outline-none focus:ring-1 focus:ring-deo-accent disabled:bg-slate-50"
      />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>@agent-name → wake agent. Ctrl+Enter để gửi.</span>
        <button
          type="button"
          onClick={() => void send()}
          disabled={disabled || sending || !value.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-deo-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? 'Đang gửi…' : 'Gửi'}
        </button>
      </div>
    </div>
  );
}
