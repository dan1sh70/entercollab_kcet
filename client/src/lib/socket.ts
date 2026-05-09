import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || '/', {
      auth: { token: localStorage.getItem('token') },
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 200,
      reconnectionDelayMax: 2000,
      timeout: 10000,
      path: '/socket.io', // Explicitly set path
    });
  }
  return socket;
}

/** Connect or reconnect with the latest token (call after login). */
export function connectSocket(): void {
  const token = localStorage.getItem('token');
  const s = getSocket();
  s.auth = { token: token || undefined };
  if (!token) {
    s.disconnect();
    return;
  }
  if (s.connected) {
    s.once('disconnect', () => s.connect());
    s.disconnect();
  } else {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
