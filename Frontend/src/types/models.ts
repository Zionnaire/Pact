/**
 * types/models.ts
 * Client-side mirrors of the Mongoose schemas in Backend/src/models.
 * Keep in sync with Pact_System_Design.md §1.
 */

export type EntryType = 'rant' | 'appreciation' | 'request' | 'observation';
export type TranscriptStatus = 'none' | 'pending' | 'done' | 'failed';
export type DropMode = 'standard' | 'anonymous' | 'urgent';
export type CycleStatus = 'open' | 'ready' | 'revealed' | 'archived';
export type PactStatus = 'active' | 'paused';
export type ResolutionStatus = 'open' | 'talking' | 'resolved';
export type ThemeSeverity = 'High' | 'Medium' | 'Low';
export type ReactionKind = 'understood' | 'surprised' | 'need_clarity';
export type Platform = 'ios' | 'android' | 'web';

export interface User {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  avatarInitial: string;
  pactId?: string;
}

export interface Pact {
  _id: string;
  name: string;
  partners: User[] | string[];
  status: PactStatus;
  cycleLengthDays: number;
  revealDay: number;
  revealTime: string;
  timezone: string;
  currentCycleId?: string;
  pausedAt?: string;
  pausedBy?: string;
  intentions?: string[];
  createdAt: string;
}

export interface Cycle {
  _id: string;
  pactId: string;
  index: number;
  name?: string;
  startsAt: string;
  revealAt: string;
  status: CycleStatus;
  revealedAt?: string;
  delaysUsed: number;
}

export interface Entry {
  _id: string;
  cycleId: string;
  pactId: string;
  authorId: string | null;
  type: EntryType;
  body?: string;
  audioUrl?: string;
  audioDurationSec?: number;
  transcript?: string;
  transcriptStatus: TranscriptStatus;
  mood?: string;
  intensity: number;
  dropMode: DropMode;
  sealed: boolean;
  createdAt: string;
  editedAt?: string;
}

export interface EntryResponse {
  _id: string;
  entryId: string;
  responderId: string;
  body: string;
  reaction?: string;
  createdAt: string;
}

export interface Resolution {
  _id: string;
  entryId: string;
  status: ResolutionStatus;
  resolvedAt?: string;
}

export interface EntryReaction {
  _id: string;
  entryId: string;
  userId: string;
  reaction: ReactionKind;
  createdAt: string;
}

export interface RevealedEntry {
  entry: Entry;
  isAnonymous: boolean;
  responses: EntryResponse[];
  resolution: Resolution | null;
  reactions: EntryReaction[];
}

export interface Theme {
  _id: string;
  pactId: string;
  name: string;
  severity: ThemeSeverity;
  mentionCount: number;
  lastSeenAt: string;
}

export interface Talk {
  _id: string;
  pactId: string;
  scheduledFor: string;
  agendaEntryIds: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

export type NotificationKind =
  | 'reveal_ready'
  | 'partner_drop'
  | 'reveal_completed'
  | 'talk_scheduled'
  | 'safety_pause'
  | 'urgent_drop'
  | 'reveal_delayed';

export interface AppNotification {
  _id: string;
  userId: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export type TherapistScope = 'summary' | 'themes' | 'pulse_history';

export interface TherapistGrant {
  _id: string;
  pactId: string;
  therapistEmail: string;
  scopes: TherapistScope[];
  expiresAt: string;
  revokedAt?: string;
}

export interface Subscription {
  _id: string;
  pactId: string;
  tier: 'free' | 'bonded';
  provider?: 'paystack' | 'manual';
  status: 'active' | 'past_due' | 'cancelled';
  renewsAt?: string;
}

export interface Invite {
  _id: string;
  pactId: string;
  inviterId: string;
  code: string;
  channel: 'sms' | 'link';
  expiresAt: string;
  acceptedAt?: string;
}

export interface PulseBreakdown {
  score: number;
  resolutionRate: number;
  appreciationRatioNorm: number;
  consistency: number;
  openness: number;
}

export interface PulseSummary extends PulseBreakdown {
  distribution: Record<EntryType, number>;
  themes: Theme[];
  history: Array<{
    cycleIndex: number;
    startsAt: string;
    revealAt: string;
    entryCount: number;
    resolvedPct: number;
    revealedAt?: string;
  }>;
}

/** Entry.authorId populated to a display-friendly shape, or null when the drop is anonymous and you're not its author. */
export interface PreviewEntry extends Omit<Entry, 'authorId'> {
  authorId: Pick<User, 'id' | 'displayName' | 'avatarInitial'> | null;
}

export interface LastCyclePreview {
  cycle: Cycle;
  entries: PreviewEntry[];
}

export interface HomeSnapshot {
  pact: Pact;
  cycle: Cycle | null;
  sealedCounts: Record<string, number>;
  streak: number;
  topTheme: Theme | null;
  recentEntries: Entry[];
  nextTalk: Talk | null;
  lastCyclePreview: LastCyclePreview | null;
}
