import { useEffect, useRef, useCallback, useState } from 'react';
import { initSocket, getSocket } from '@/lib/socket';
import { Message } from '@/types';

export const useChat = (conversationId: string, token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = initSocket(token);
    }

    const socket = socketRef.current;

    const handleNewMessage = (message: Message) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleMessagesLoaded = (data: Message[]) => {
      setMessages(data);
      setIsLoading(false);
    };

    socket.on(`conversation:${conversationId}:message`, handleNewMessage);
    socket.on(`conversation:${conversationId}:loaded`, handleMessagesLoaded);

    socket.emit(`conversation:${conversationId}:load`);

    return () => {
      socket.off(`conversation:${conversationId}:message`, handleNewMessage);
      socket.off(`conversation:${conversationId}:loaded`, handleMessagesLoaded);
    };
  }, [conversationId, token]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current) return;

      const socket = socketRef.current;
      socket.emit(`conversation:${conversationId}:send`, {
        content,
        type: 'text',
      });
    },
    [conversationId]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
