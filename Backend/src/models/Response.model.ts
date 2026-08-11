import { Schema, model, Document, Types } from 'mongoose';

export interface IResponse extends Document {
  _id: Types.ObjectId;
  entryId: Types.ObjectId;
  pactId: Types.ObjectId;
  responderId: Types.ObjectId;
  body: string;
  reaction?: string;
  createdAt: Date;
}

const responseSchema = new Schema<IResponse>(
  {
    entryId: { type: Schema.Types.ObjectId, ref: 'Entry', required: true, index: true },
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
    responderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 2000 },
    reaction: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Response = model<IResponse>('Response', responseSchema);
