import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Conversation, Message } from '@/types';
import { ChatPanel } from '@/components/ChatPanel';
import { ContextPanel } from '@/components/ContextPanel';
import { Search } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface OutletContext {
  setPageTitle: (title: string) => void;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    client_id: '1',
    last_message: 'Bạn có thể gửi báo cáo cho tôi không?',
    last_message_at: new Date(Date.now() - 300000).toISOString(),
    unread_count: 2,
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: '1',
      name: 'Công ty ABC',
      email: 'contact@abc.com',
      phone: '0901234567',
      company: 'ABC Corp',
      company_id: 'c1',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: '2',
    task_id: '2',
    last_message: 'Công việc được gán cho tôi',
    last_message_at: new Date(Date.now() - 1800000).toISOString(),
    unread_count: 0,
    company_id: 'c1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    task: {
      id: '2',
      title: 'Phân tích dữ liệu',
      description: 'Phân tích xu hướng thị trường',
      status: 'in_progress',
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
];

const mockMessages: Message[] = [
  {
    id: '1',
    conversation_id: '1',
    user_id: 'client1',
    content: 'Xin chào, tôi cần báo cáo chi tiết về đơn hàng',
    type: 'text',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: 'client1',
      email: 'contact@abc.com',
      name: 'Nguyễn Văn A',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '2',
    conversation_id: '1',
    user_id: 'user1',
    content: 'Vâng, tôi sẽ chuẩn bị báo cáo cho bạn ngay',
    type: 'text',
    created_at: new Date(Date.now() - 3000000).toISOString(),
    user: {
      id: 'user1',
      email: 'me@company.com',
      name: 'Trần Thị B',
      role: 'user',
      company_id: 'c1',
    },
  },
  {
    id: '3',
    conversation_id: '1',
    user_id: 'client1',
    content: 'Bạn có thể gửi báo cáo cho tôi không?',
    type: 'text',
    created_at: new Date(Date.now() - 300000).toISOString(),
    user: {
      id: 'client1',
      email: 'contact@abc.com',
      name: 'Nguyễn Văn A',
      role: 'user',
      company_id: 'c1',
    },
  },
];

export const Chat = () => {
  const { setPageTitle } = useOutletContext<OutletContext>();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    mockConversations[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  useEffect(() => {
    setPageTitle('Chat');
  }, [setPageTitle]);

  const currentConversation = mockConversations.find(
    (c) => c.id === selectedConversation
  );

  const filteredConversations = mockConversations.filter(
    (conv) =>
      conv.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.task?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      conversation_id: selectedConversation || '1',
      user_id: 'user1',
      content,
      type: 'text',
      created_at: new Date().toISOString(),
      user: {
        id: 'user1',
        email: 'me@company.com',
        name: 'Bạn',
        role: 'user',
        company_id: 'c1',
      },
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="h-full flex gap-6">
      <div className="w-80 flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-deo-accent focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Không tìm thấy cuộc trò chuyện
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                  selectedConversation === conv.id ? 'bg-slate-100' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-slate-900 truncate">
                    {conv.client?.name || conv.task?.title}
                  </h4>
                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-deo-accent text-white text-xs font-bold rounded-full">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 truncate">
                  {conv.last_message}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatTimeAgo(conv.last_message_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <ChatPanel
            messages={messages.filter(
              (m) => m.conversation_id === selectedConversation
            )}
            onSendMessage={handleSendMessage}
            currentUserId="user1"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Chọn cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>

      <div className="w-80">
        {currentConversation && (
          <ContextPanel
            client={currentConversation.client}
            task={currentConversation.task}
          />
        )}
      </div>
    </div>
  );
};
