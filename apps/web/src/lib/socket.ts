import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL =
  (import.meta as any).env?.VITE_SOCKET_URL ||
  ((import.meta as any).env?.VITE_API_URL
    ? String((import.meta as any).env.VITE_API_URL).replace(/\/api\/?$/, '')
    : 'http://localhost:3001');

export const initSocket = (token: string): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    path: '/socket.io',
    auth: {
      token,
    },
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;
