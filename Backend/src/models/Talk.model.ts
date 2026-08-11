import { Schema, model, Document, Types } from 'mongoose';

export type TalkStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ITalk extends Document {
  _id: Types.ObjectId;
  pactId: Types.ObjectId;
  scheduledFor: Date;
  agendaEntryIds: Types.ObjectId[];
  status: TalkStatus;
  createdAt: Date;
}

const talkSchema = new Schema<ITalk>(
  {
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
    scheduledFor: { type: Date, required: true },
    agendaEntryIds: [{ type: Schema.Types.ObjectId, ref: 'Entry' }],
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Talk = model<ITalk>('Talk', talkSchema);
