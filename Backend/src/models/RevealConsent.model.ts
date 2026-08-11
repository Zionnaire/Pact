import { Schema, model, Document, Types } from 'mongoose';

export interface IRevealConsent extends Document {
  _id: Types.ObjectId;
  cycleId: Types.ObjectId;
  pactId: Types.ObjectId;
  userId: Types.ObjectId;
  consentedAt: Date;
}

const revealConsentSchema = new Schema<IRevealConsent>({
  cycleId: { type: Schema.Types.ObjectId, ref: 'Cycle', required: true },
  pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  consentedAt: { type: Date, default: Date.now },
});

// One consent row per user per cycle — also what performReveal counts against.
revealConsentSchema.index({ cycleId: 1, userId: 1 }, { unique: true });

export const RevealConsent = model<IRevealConsent>('RevealConsent', revealConsentSchema);
