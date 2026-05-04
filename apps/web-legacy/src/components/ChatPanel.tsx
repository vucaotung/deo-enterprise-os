import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Message } from '@/types';
import { formatDate } from '@/lib/utils';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  currentUserId?: string;
}

export const ChatPanel = ({
  messages,
  onSendMessage,
  isLoading = false,
  currentUserId,
}: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Không có tin nhắn</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.user_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.user_id === currentUserId
                    ? 'bg-deo-accent text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                {message.user && message.user_id !== currentUserId && (
                  <p className="text-xs font-semibold mb-1">
                    {message.user.name}
                  </p>
                )}
                <p className="text-sm break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.user_id === currentUserId
                      ? 'text-cyan-100'
                      : 'text-slate-500'
                  }`}
                >
                  {formatDate(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            rows={3}
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-slate-200 p-2 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 bg-deo-accent text-white rounded-lg p-2 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
