import { useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    connectSocket();
    socketRef.current = getSocket();
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const joinRoom = useCallback((roomId: number) => {
    socketRef.current?.emit('join:room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: number) => {
    socketRef.current?.emit('leave:room', roomId);
  }, []);

  const joinProject = useCallback((postId: number) => {
    socketRef.current?.emit('join:project', postId);
  }, []);

  const leaveProject = useCallback((postId: number) => {
    socketRef.current?.emit('leave:project', postId);
  }, []);

  return { socket: socketRef.current, emit, on, joinRoom, leaveRoom, joinProject, leaveProject };
}
