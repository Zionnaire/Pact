/**
 * middleware/upload.middleware.ts
 * Multer memory storage + Cloudinary upload stream.
 * Avoids the multer-storage-cloudinary peer dependency conflict.
 *
 * uploadAudio → voice note drops (.m4a, .mp4, .webm)  → Cloudinary
 * uploadImage → user avatar photos (.jpg, .png, .webp) → Cloudinary
 *
 * After middleware runs, access the Cloudinary URL via:
 *   req.cloudinaryUrl       (string)
 *   req.cloudinaryPublicId  (string)
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import { cloudinary } from '../configs/cloudinary';
import { config } from '../configs/config';
import { ApiError } from '../utils/ApiError';

const memoryStorage = multer.memoryStorage();

const audioMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mp4', 'audio/webm', 'audio/ogg', 'video/mp4', 'audio/mpeg'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Invalid audio format. Use .m4a, .mp4, .webm, or .ogg'));
      return;
    }
    cb(null, true);
  },
}).single('audio');

const imageMulter = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Invalid image format. Use .jpg, .png, or .webp'));
      return;
    }
    cb(null, true);
  },
}).single('avatar');

function streamToCloudinary(
  buffer: Buffer,
  options: object,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error('No result from Cloudinary'));
      resolve({ secure_url: result.secure_url, public_id: result.public_id });
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export function uploadAudio(req: Request, res: Response, next: NextFunction) {
  if (!config.cloudinary.configured) {
    next(ApiError.notImplemented('Media upload is not configured on this server yet'));
    return;
  }

  audioMulter(req, res, async (err) => {
    if (err) return next(ApiError.badRequest(err.message));
    if (!req.file) return next(ApiError.badRequest('No audio file uploaded'));

    try {
      const result = await streamToCloudinary(req.file.buffer, {
        folder: 'pact/voice-notes',
        resource_type: 'video', // Cloudinary uses 'video' for audio
        format: 'mp4',
      });
      req.cloudinaryUrl = result.secure_url;
      req.cloudinaryPublicId = result.public_id;
      next();
    } catch {
      next(ApiError.internal('Audio upload to Cloudinary failed'));
    }
  });
}

export function uploadImage(req: Request, res: Response, next: NextFunction) {
  if (!config.cloudinary.configured) {
    next(ApiError.notImplemented('Media upload is not configured on this server yet'));
    return;
  }

  imageMulter(req, res, async (err) => {
    if (err) return next(ApiError.badRequest(err.message));
    if (!req.file) return next(ApiError.badRequest('No image file uploaded'));

    try {
      const result = await streamToCloudinary(req.file.buffer, {
        folder: 'pact/avatars',
        resource_type: 'image',
        format: 'webp',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      req.cloudinaryUrl = result.secure_url;
      req.cloudinaryPublicId = result.public_id;
      next();
    } catch {
      next(ApiError.internal('Image upload to Cloudinary failed'));
    }
  });
}
