import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  displayName: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  avatarUrl?: string;
  avatarInitial: string;
  pactId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String },
    avatarInitial: { type: String, required: true, maxlength: 2 },
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

userSchema.index({ pactId: 1 });

// Every consumer of a User document — direct or populated as a sub-document
// inside another response (e.g. Pact.partners) — gets `id`, never the raw
// `_id`/`__v`. Without this, only the hand-sanitized auth endpoints (see
// sanitizeUser() in auth.controller.ts) exposed `id`; anything that returned
// a populated `partners` array leaked `_id` instead, silently breaking every
// frontend comparison against `user.id` (React key warnings on Pact screen,
// and — more seriously — RevealScreen's `partner.id !== user.id` filter,
// which always evaluated true and could misidentify the partner).
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj._id;
    delete obj.__v;
  },
});

export const User = model<IUser>('User', userSchema);
