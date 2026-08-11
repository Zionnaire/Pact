import { Schema, model, Document, Types } from 'mongoose';

export type CycleStatus = 'open' | 'ready' | 'revealed' | 'archived';

export interface ICycle extends Document {
  _id: Types.ObjectId;
  pactId: Types.ObjectId;
  index: number;
  name?: string;
  startsAt: Date;
  revealAt: Date;
  status: CycleStatus;
  revealedAt?: Date;
  delaysUsed: number;
  createdAt: Date;
}

// Either partner may push the reveal back — mirrors the unilateral pause
// invariant. Capped per cycle so it can't be used to indefinitely stall.
export const MAX_REVEAL_DELAYS_PER_CYCLE = 2;
export const REVEAL_DELAY_HOURS = 24;

const cycleSchema = new Schema<ICycle>(
  {
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
    index: { type: Number, required: true },
    name: { type: String, trim: true, maxlength: 60 },
    startsAt: { type: Date, required: true },
    revealAt: { type: Date, required: true },
    status: { type: String, enum: ['open', 'ready', 'revealed', 'archived'], default: 'open', index: true },
    revealedAt: { type: Date },
    delaysUsed: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

cycleSchema.index({ pactId: 1, index: -1 });

export const Cycle = model<ICycle>('Cycle', cycleSchema);
