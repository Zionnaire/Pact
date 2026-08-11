/**
 * app.ts
 * Express application setup.
 * Registers all global middleware and mounts versioned routes.
 * Does NOT start the server — that is index.ts's job.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './middleware/error.middleware';
import { globalLimiter } from './middleware/rateLimit';
import routes from './routes/index';
import publicRoutes from './routes/public.routes';
import { paystackWebhook } from './controllers/public.controller';
import { config } from './configs/config';
import { logger } from './utils/logger';

const app: Application = express();

// ── Security headers
app.use(helmet());

// ── CORS
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Paystack webhook — registered BEFORE the global JSON parser because
// HMAC signature verification needs the raw request bytes (see
// controllers/public.controller.ts).
app.post('/api/public/paystack/webhook', express.raw({ type: 'application/json' }), paystackWebhook);

// ── Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP request logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ── Health check (no auth, no rate limit)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    service:   'pact-backend',
    env:       process.env.NODE_ENV,
  });
});

// ── Versioned API routes
app.use('/api/v1', globalLimiter, routes);

// ── Remaining public/unauthenticated routes (SMS delivery callbacks, etc.)
app.use('/api/public', globalLimiter, publicRoutes);

// ── 404 fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ── Global error handler (must be last)
app.use(errorMiddleware);

export default app;
