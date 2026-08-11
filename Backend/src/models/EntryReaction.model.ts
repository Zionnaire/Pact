import { Schema, model, Document, Types } from 'mongoose';

export type ReactionKind = 'understood' | 'surprised' | 'need_clarity';

/**
 * A quick one-tap reaction the reader leaves on a revealed entry — distinct
 * from Response (a written reply) and Resolution (open/talking/resolved
 * status). One per user per entry; re-tapping the same or a different
 * reaction upserts.
 */
export interface IEntryReaction extends Document {
  _id: Types.ObjectId;
  entryId: Types.ObjectId;
  pactId: Types.ObjectId;
  userId: Types.ObjectId;
  reaction: ReactionKind;
  createdAt: Date;
}

const entryReactionSchema = new Schema<IEntryReaction>(
  {
    entryId: { type: Schema.Types.ObjectId, ref: 'Entry', required: true },
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reaction: { type: String, enum: ['understood', 'surprised', 'need_clarity'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

entryReactionSchema.index({ entryId: 1, userId: 1 }, { unique: true });

export const EntryReaction = model<IEntryReaction>('EntryReaction', entryReactionSchema);
