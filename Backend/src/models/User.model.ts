import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  displayName: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  avatarUrl?: string;
  avatarInitial: string;
  bio?: string;
  pactId?: Types.ObjectId;
  isActive: boolean;
  /** False for a "quick join" account (name only, invite-code entry) — see pact.controller.ts quickJoinInvite. Gates dropping entries until real credentials are set (auth.controller.ts completeProfile), so nobody writes sealed content into an account they might not be able to recover. */
  profileComplete: boolean;
  passwordResetCodeHash?: string;
  passwordResetExpiresAt?: Date;
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
    bio: { type: String, trim: true, maxlength: 160 },
    pactId: { type: Schema.Types.ObjectId, ref: 'Pact' },
    isActive: { type: Boolean, default: true },
    profileComplete: { type: Boolean, default: true },
    // Forgot-password OTP — a code, not a magic link, since deep-linking
    // straight into the app from an email would need universal/app-links
    // infra this project doesn't have yet. Both select: false — never part
    // of a normal user fetch.
    passwordResetCodeHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
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
