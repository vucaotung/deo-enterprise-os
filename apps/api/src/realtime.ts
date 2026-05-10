import type { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setIo(io: SocketIOServer) {
  ioInstance = io;
}

export function getIo(): SocketIOServer | null {
  return ioInstance;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  ioInstance?.to(`user:${userId}`).emit(event, payload);
}

export function emitToTask(taskId: string, event: string, payload: unknown) {
  ioInstance?.to(`task:${taskId}`).emit(event, payload);
}
