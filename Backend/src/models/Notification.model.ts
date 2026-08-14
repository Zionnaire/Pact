import { Schema, model, Document, Types } from 'mongoose';

export type NotificationKind =
  | 'reveal_ready'
  | 'partner_drop'
  | 'reveal_completed'
  | 'talk_scheduled'
  | 'safety_pause'
  | 'urgent_drop'
  | 'reveal_delayed'
  | 'partner_left'
  | 'therapist_granted'
  | 'therapist_revoked';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: [
        'reveal_ready',
        'partner_drop',
        'reveal_completed',
        'talk_scheduled',
        'safety_pause',
        'urgent_drop',
        'reveal_delayed',
        'partner_left',
        'therapist_granted',
        'therapist_revoked',
      ],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification = model<INotification>('Notification', notificationSchema);
