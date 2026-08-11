import { Schema, model, Document, Types } from 'mongoose';

export type TherapistScope = 'summary' | 'themes' | 'pulse_history';

export interface ITherapistGrant extends Document {
  _id: Types.ObjectId;
  pactId: Types.ObjectId;
  grantedBy: Types.ObjectId;
  therapistEmail: string;
  scopes: TherapistScope[];
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

const therapistGrantSchema = new Schema<ITherapistGrant>(
  {
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    therapistEmail: { type: String, required: true, lowercase: true, trim: true },
    scopes: {
      type: [{ type: String, enum: ['summary', 'themes', 'pulse_history'] }],
      default: ['summary'],
    },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const TherapistGrant = model<ITherapistGrant>('TherapistGrant', therapistGrantSchema);
