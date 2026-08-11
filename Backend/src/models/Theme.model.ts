import { Schema, model, Document, Types } from 'mongoose';

export type ThemeSeverity = 'High' | 'Medium' | 'Low';

export interface ITheme extends Document {
  _id: Types.ObjectId;
  pactId: Types.ObjectId;
  name: string;
  severity: ThemeSeverity;
  mentionCount: number;
  lastSeenAt: Date;
}

const themeSchema = new Schema<ITheme>({
  pactId: { type: Schema.Types.ObjectId, ref: 'Pact', required: true, index: true },
  name: { type: String, required: true },
  severity: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  mentionCount: { type: Number, default: 0 },
  lastSeenAt: { type: Date, default: Date.now },
});

themeSchema.index({ pactId: 1, name: 1 }, { unique: true });

export const Theme = model<ITheme>('Theme', themeSchema);
