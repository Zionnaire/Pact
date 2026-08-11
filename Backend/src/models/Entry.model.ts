import { Schema, model, Document, Types } from 'mongoose';

export type EntryType = 'rant' | 'appreciation' | 'request' | 'observation';
export type TranscriptStatus = 'none' | 'pending' | 'done' | 'failed';
export type DropMode = 'standard' | 'anonymous' | 'urgent';

export interface IEntry extends Document {
  _id: Types.ObjectId;
  cycleId: Types.ObjectId;
  pactId: Types.ObjectId;
  authorId: Types.ObjectId;
  type: EntryType;
  body?: string;
  audioUrl?: string;
  audioPublicId?: string;
  audioDurationSec?: number;
  transcript?: string;
  transcriptStatus: TranscriptStatus;
  mood?: string;
  intensity: number;
  dropMode: DropMode;
  sealed: boolean;
  createdAt: Date;
  editedAt?: Date;
}

const entrySchema = new Schema<IEntry>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'Cycle', required: true, index: true },
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['rant', 'appreciation', 'request', 'observation'], required: true },
    body: { type: String, maxlength: 4000 },
    audioUrl: { type: String },
    audioPublicId: { type: String },
    audioDurationSec: { type: Number },
    transcript: { type: String },
    transcriptStatus: { type: String, enum: ['none', 'pending', 'done', 'failed'], default: 'none' },
    mood: { type: String },
    intensity: { type: Number, min: 1, max: 5, required: true },
    // 'anonymous' hides the author at reveal time (see getRevealedCycle);
    // 'urgent' fires an immediate content-free nudge to the partner without
    // unsealing anything early. See Entry controller.
    dropMode: { type: String, enum: ['standard', 'anonymous', 'urgent'], default: 'standard' },
    sealed: { type: Boolean, default: true },
    editedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

entrySchema.pre('validate', function validateContent(next) {
  if (!this.body && !this.audioUrl) {
    next(new Error('Entry must have either body text or audioUrl'));
    return;
  }
  next();
});

// Author's own vault + partner's revealed-cycle read path
entrySchema.index({ cycleId: 1, authorId: 1 });

export const Entry = model<IEntry>('Entry', entrySchema);
