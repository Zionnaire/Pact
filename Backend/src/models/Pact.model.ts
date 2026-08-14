import { Schema, model, Document, Types } from 'mongoose';

export type PactStatus = 'active' | 'paused' | 'ended';

export interface IPact extends Document {
  _id: Types.ObjectId;
  name: string;
  partners: Types.ObjectId[];
  status: PactStatus;
  cycleLengthDays: number;
  revealDay: number;
  revealTime: string;
  timezone: string;
  currentCycleId?: Types.ObjectId;
  pausedAt?: Date;
  pausedBy?: Types.ObjectId;
  /** What the creator hoped for at onboarding (e.g. "Heard", "Safe") — captured once, shown back later, never required. */
  intentions?: string[];
  createdAt: Date;
}

const pactSchema = new Schema<IPact>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    partners: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (v: Types.ObjectId[]) => v.length <= 2,
        message: 'A pact may have at most 2 partners',
      },
    },
    status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active' },
    cycleLengthDays: { type: Number, required: true, min: 1, max: 30, default: 7 },
    revealDay: { type: Number, required: true, min: 0, max: 6 },
    revealTime: { type: String, required: true, default: '20:00' },
    timezone: { type: String, required: true, default: 'UTC' },
    currentCycleId: { type: Schema.Types.ObjectId, ref: 'Cycle' },
    pausedAt: { type: Date },
    pausedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    intentions: { type: [String], default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Pact = model<IPact>('Pact', pactSchema);
