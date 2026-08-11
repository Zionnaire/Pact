import { Schema, model, Document, Types } from 'mongoose';

export type ResolutionStatus = 'open' | 'talking' | 'resolved';

export interface IResolution extends Document {
  _id: Types.ObjectId;
  entryId: Types.ObjectId;
  pactId: Types.ObjectId;
  status: ResolutionStatus;
  resolvedAt?: Date;
}

const resolutionSchema = new Schema<IResolution>({
  entryId: { type: Schema.Types.ObjectId, ref: 'Entry', required: true, unique: true },
  pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
  status: { type: String, enum: ['open', 'talking', 'resolved'], default: 'open' },
  resolvedAt: { type: Date },
});

export const Resolution = model<IResolution>('Resolution', resolutionSchema);
