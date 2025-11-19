
import { io, type Socket } from 'socket.io-client';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

let socket: Socket | null = null;

export function connectSocket(userID?: number) {
  if (!socket) {
    socket = io(BASE, { transports: ['websocket'], autoConnect: true });
    socket.on('connect', () => {
      console.log('socket connected', socket?.id);
      if (userID !== undefined && userID !== null) socket?.emit('identify', { userID });
    });
    socket.on('connect_error', (err) => console.warn('socket connect_error', err));
  } else if (userID !== undefined && userID !== null) {
    socket.emit('identify', { userID });
  }
  return socket;
}

export function onNotification(cb: (payload: any) => void) {
  if (!socket) return () => {};
  const handler = (p: any) => cb(p);
  socket.on('notification', handler);
  return () => socket?.off('notification', handler);
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
