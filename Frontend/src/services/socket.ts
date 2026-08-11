/**
 * services/socket.ts
 * Real-time reveal-consent sync — mirrors Backend/src/configs/socket.ts.
 * Connects lazily (only screens that need it, i.e. Reveal, call connect()).
 */

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { tokenStorage } from '../utils/storage';

const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await tokenStorage.getAccessToken();
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
