/**
 * configs/socket.ts
 * Socket.IO server — real-time reveal dual-consent sync.
 * All socket events live here.
 *
 * Events (client → server):
 *   join:pact           → join pact room
 *   reveal:ready         → mark self ready
 *   reveal:unready       → unmark self
 *   checkin:sent         → notify partner (not sealed)
 *   entry:dropped        → notify partner (count only, never content)
 *
 * Events (server → client):
 *   reveal:state         → { readyUserIds, bothReady }
 *   reveal:open           → both ready, vault unlocked
 *   checkin:received      → partner check-in
 *   entry:partner_drop    → { count } partner added an entry
 */

import { Server, Socket } from 'socket.io';
import http from 'http';
import { config } from './config';
import { verifyAccessToken } from '../utils/generateToken';
import { logger } from '../utils/logger';

// In-memory reveal state (single-instance only — see Pact_System_Design.md §7 on
// moving background/shared state to Redis before horizontally scaling).
export const revealReadyState: Map<string, Set<string>> = new Map();

let io: Server;

export function initSocket(httpServer: http.Server): void {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string;
    if (!token) return next(new Error('UNAUTHORIZED: No token provided'));

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      socket.data.pactId = decoded.pactId;
      next();
    } catch {
      next(new Error('UNAUTHORIZED: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId;
    const pactId: string | undefined = socket.data.pactId;
    logger.info(`Socket connected: userId=${userId}`);

    if (pactId) {
      socket.join(`pact:${pactId}`);
      socket.join(`user:${userId}`);
    }

    socket.on('join:pact', (pId: string) => {
      socket.join(`pact:${pId}`);
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined pact:${pId}`);
    });

    socket.on('reveal:ready', (pId: string) => {
      if (!revealReadyState.has(pId)) {
        revealReadyState.set(pId, new Set());
      }
      revealReadyState.get(pId)!.add(userId);

      const readyIds = Array.from(revealReadyState.get(pId)!);
      io.to(`pact:${pId}`).emit('reveal:state', {
        readyUserIds: readyIds,
        bothReady: readyIds.length >= 2,
      });

      logger.info(`reveal:ready — pact:${pId}, readyCount=${readyIds.length}`);
    });

    socket.on('reveal:unready', (pId: string) => {
      revealReadyState.get(pId)?.delete(userId);
      const readyIds = Array.from(revealReadyState.get(pId) || []);
      io.to(`pact:${pId}`).emit('reveal:state', {
        readyUserIds: readyIds,
        bothReady: false,
      });
    });

    socket.on('checkin:sent', (payload: { pactId: string; mood: string; label: string }) => {
      socket.to(`pact:${payload.pactId}`).emit('checkin:received', {
        mood: payload.mood,
        label: payload.label,
      });
    });

    socket.on('entry:dropped', (payload: { pactId: string; totalCount: number }) => {
      socket.to(`pact:${payload.pactId}`).emit('entry:partner_drop', {
        count: payload.totalCount,
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: userId=${userId}, reason=${reason}`);
    });
  });

  logger.info('✅ Socket.IO initialised');
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialised. Call initSocket() first.');
  return io;
}

export function clearRevealReadyState(pactId: string): void {
  revealReadyState.delete(pactId);
}
