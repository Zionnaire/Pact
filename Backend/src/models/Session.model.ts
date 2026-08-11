import { Schema, model, Document, Types } from 'mongoose';

export type Platform = 'ios' | 'android' | 'web';

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  deviceId: string;
  platform: Platform;
  expoPushToken?: string;
  appVersion?: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true, select: false },
    deviceId: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
    expoPushToken: { type: String },
    appVersion: { type: String },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

sessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const Session = model<ISession>('Session', sessionSchema);
