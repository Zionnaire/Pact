import { Schema, model, Document, Types } from 'mongoose';

/**
 * One row per user per calendar day (UTC), incremented on every paid AI
 * call. Backs the daily cap on /ai/tone-check — see
 * Pact_System_Design.md §6 on cost-conscious AI usage.
 */
export interface IAiUsage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD, UTC
  count: number;
}

const aiUsageSchema = new Schema<IAiUsage>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  count: { type: Number, default: 0 },
});

aiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

export const AiUsage = model<IAiUsage>('AiUsage', aiUsageSchema);
