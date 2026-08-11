/**
 * index.ts
 * Server entry point.
 * Creates HTTP server, attaches Socket.IO, connects DB, starts listening.
 */

import http from 'http';
import app from './app';
import { connectDB } from './configs/db';
import { initSocket } from './configs/socket';
import { startCronJobs } from './configs/cron';
import { config } from './configs/config';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  try {
    // ── Connect database
    await connectDB();

    // ── Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // ── Attach Socket.IO
    initSocket(httpServer);

    // ── Cycle transitions + reveal-day notifications (single-instance — see
    // Pact_System_Design.md §7)
    startCronJobs();

    // ── Start listening
    httpServer.listen(config.port, () => {
      logger.info(`✅ Pact server running on port ${config.port} [${config.nodeEnv}]`);
    });

    // ── Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received — shutting down gracefully...');
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
