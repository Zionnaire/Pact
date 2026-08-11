/**
 * configs/db.ts
 * MongoDB connection via Mongoose.
 * Connects once on server start.
 * Logs connection lifecycle events.
 */

import mongoose from 'mongoose';
import { config } from './config';
import { logger } from '../utils/logger';

export async function connectDB(): Promise<void> {
  await mongoose.connect(config.mongoUri, { dbName: 'pact' });
  logger.info('✅ MongoDB connected');

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected — attempting reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
}
