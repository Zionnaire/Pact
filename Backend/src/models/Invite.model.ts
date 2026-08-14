import { Schema, model, Document, Types } from 'mongoose';

export type InviteChannel = 'sms' | 'link' | 'email';

export interface IInvite extends Document {
  _id: Types.ObjectId;
  pactId: Types.ObjectId;
  inviterId: Types.ObjectId;
  code: string;
  channel: InviteChannel;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: Types.ObjectId;
  createdAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
    inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true, unique: true },
    channel: { type: String, enum: ['sms', 'link', 'email'], required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Invite = model<IInvite>('Invite', inviteSchema);
