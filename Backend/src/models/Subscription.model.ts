import { Schema, model, Document, Types } from 'mongoose';

export type SubscriptionTier = 'free' | 'bonded';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled';

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  pactId: Types.ObjectId;
  tier: SubscriptionTier;
  provider?: 'paystack' | 'manual';
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  status: SubscriptionStatus;
  renewsAt?: Date;
  grantedBy?: Types.ObjectId;
}

const subscriptionSchema = new Schema<ISubscription>({
  pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, unique: true },
  tier: { type: String, enum: ['free', 'bonded'], default: 'free' },
  provider: { type: String, enum: ['paystack', 'manual'] },
  providerCustomerId: { type: String },
  providerSubscriptionId: { type: String },
  status: { type: String, enum: ['active', 'past_due', 'cancelled'], default: 'active' },
  renewsAt: { type: Date },
  grantedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
