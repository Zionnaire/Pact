/**
 * configs/cloudinary.ts
 * Cloudinary SDK configuration.
 * Used for: voice note audio uploads, user avatar images.
 * No-ops (throws only when actually invoked) if not configured, so the app
 * still boots without a Cloudinary account.
 */

import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';
import { logger } from '../utils/logger';

if (config.cloudinary.configured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  logger.info('✅ Cloudinary configured');
} else {
  logger.warn('⚠️  Cloudinary not configured — media upload endpoints will return 501');
}

export { cloudinary };
