# Pact — System Design

**Say what you mean. Revealed together. Resolved with intention.**

Pact is a relationship accountability app for couples built on a sealed-vault mechanic: each partner privately logs emotional entries during a cycle; nothing is visible to the other until both consent to unlock (the Reveal); afterwards partners respond, resolve, and track patterns.

**Stack:** MERN + Expo (React Native). Express/TypeScript API, MongoDB/Mongoose, JWT auth, Socket.IO for real-time reveal sync, Expo Router for the client. This supersedes an earlier Lovable/TanStack Start/Postgres-RLS draft — the product intent is unchanged, the substrate is not. See §7 for what moved and why.

---

## 1. Core domain model

| Entity | Key fields | Notes |
|---|---|---|
| `User` | id, displayName, email, phone, passwordHash, avatarUrl, avatarInitial, pactId, isActive, createdAt | 1:1 with auth identity |
| `Pact` | id, name, partners[2] (ref User), status (`active`/`paused`), cycleLengthDays, revealDay, revealTime, timezone, currentCycleId | The couple container. Capped at 2 partners — no separate `pact_member` table |
| `Invite` | id, pactId, inviterId, code, channel (`sms`/`link`), expiresAt, acceptedAt | Single-use pairing code. `link` is the zero-cost default; `sms` requires Twilio |
| `Cycle` | id, pactId, index, startsAt, revealAt, status (`open`/`ready`/`revealed`/`archived`) | One open cycle per pact |
| `Entry` | id, cycleId, authorId, type (`rant`/`appreciation`/`request`/`observation`), body, audioUrl, audioDurationSec, transcript, transcriptStatus (`none`/`pending`/`done`/`failed`), mood, intensity (1–5), sealed, createdAt, editedAt | Text or voice. Never readable by partner while cycle is `open` |
| `RevealConsent` | cycleId, userId, consentedAt | Reveal requires 2 rows for the same cycle |
| `Response` | id, entryId, responderId, body, reaction, createdAt | Only after reveal |
| `Resolution` | id, entryId, status (`open`/`talking`/`resolved`), resolvedAt | Drives resolution % |
| `Theme` | id, pactId, name, severity, mentionCount, lastSeenAt | Derived from entry text via AI clustering |
| `Talk` | id, pactId, scheduledFor, agendaEntryIds[], status | Talk scheduler |
| `Notification` | id, userId, kind, payload, readAt | Nudges, partner drops, alerts |
| `TherapistGrant` | id, pactId, therapistEmail, scopes[], expiresAt, revokedAt | Read-only aggregate summaries only. No therapist `User` account — see §3 |
| `Subscription` | pactId, tier (`free`/`bonded`), provider (`paystack`), providerCustomerId, providerSubscriptionId, status, renewsAt | Gated behind `PAYMENTS_ENABLED`; see §6 |
| `Session` | id, userId, refreshTokenHash, deviceId, platform (`ios`/`android`/`web`), expoPushToken, appVersion, createdAt, lastUsedAt, expiresAt, revokedAt | One row per logged-in device. Backs refresh rotation, `logoutAll`, and push delivery — **new in this revision**, required for JWT refresh and Expo push to function at all |

### Invariants
1. An entry authored in an open cycle is readable **only** by its author until `cycle.status = revealed`.
2. `cycle.status → revealed` requires two `RevealConsent` rows **and** `now >= revealAt`, applied inside a single Mongo transaction (requires a replica-set deployment — Atlas gives you this by default).
3. Consent is revocable until the reveal transaction commits.
4. A paused pact accepts no new entries and blocks reveals; only Safety screens remain reachable.
5. Therapists never read entry bodies — only aggregate summaries (counts, scores, themes).
6. An entry may be edited or deleted by its author only while `cycle.status = open`; once the cycle moves to `ready` it is locked pending reveal.
7. Voice entries remain fully usable if transcription fails, is disabled, or is still pending — transcript is an enhancement, never a dependency for playback or reveal.
8. A pact is `bonded` only while `subscription.status = active`; on cancellation or payment failure it reverts to `free` at the *end* of the paid period, never mid-cycle.

---

## 2. The cycle state machine

```text
open ──(revealAt reached)──> ready ──(both consents)──> revealed ──(next cycle opens)──> archived
  ↑                              ↓
  └────── pause (safety) ────────┴──> paused ──(resume)──> open
```

- **open** — both partners drop entries; counts are visible, content is not.
- **ready** — countdown finished; UI shows the dual-consent lock in the Vault.
- **revealed** — Reveal ceremony plays; entries unseal in staggered order; responses/resolutions unlock.
- **archived** — feeds Pulse metrics and theme extraction; a fresh cycle opens automatically.

The `open → ready` transition and reveal-day notification fan-out are time-based and run off an in-process scheduler (`node-cron`, checked every minute) rather than an external cron service — see §6. `ready → revealed` is never automatic; it always requires the explicit two-consent transaction.

---

## 3. Server surface (Express REST API)

All routes are versioned under `/api/v1`. Authenticated routes require `Authorization: Bearer <accessToken>`; `req.user` and `req.pactId` are attached by `authMiddleware`, and cross-pact access is blocked by `requirePactMember` on every pact-scoped route (see §7 for how this replaces RLS).

| Route | Purpose | Auth rule |
|---|---|---|
| `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all` | Identity + session lifecycle | public / refresh-token / authed |
| `GET /auth/me`, `PATCH /auth/me`, `POST /auth/me/avatar` | Profile | authed |
| `POST /pacts`, `POST /pacts/invites`, `GET /pacts/invites`, `DELETE /pacts/invites/:id`, `POST /pacts/invites/:code/accept` | Pairing | authed, not already paired (for create/accept) |
| `GET /home` | Active cycle, sealed counts, streak | pact member |
| `POST /entries`, `PATCH /entries/:id`, `DELETE /entries/:id` | Drops (text or multipart voice) | author only, cycle open |
| `GET /entries/mine` | Author's own vault | author only |
| `POST /cycles/:id/consent` | Toggle reveal consent | partner only |
| `POST /cycles/:id/reveal` | Atomic unseal | server-checked: 2 consents + time |
| `GET /cycles/:id/revealed` | Entries + responses | pact partners, revealed cycles only |
| `POST /entries/:id/responses`, `PATCH /entries/:id/resolution` | Post-reveal work | partners |
| `GET /pulse` | Score, distribution, themes, history | partners |
| `POST /talks`, `GET /talks` | Talk agenda | partners |
| `POST /therapist/grants`, `DELETE /therapist/grants/:id` | Portal management | partner only |
| `GET /therapist/summary` | Aggregate-only read | therapist magic-link token, not a partner session |
| `PATCH /pacts/me/pause`, `PATCH /pacts/me/resume` | Safety pause | either partner, unilateral |
| `POST /ai/tone-check` | AI rewrite suggestion on a draft | author only; draft never persisted; rate-limited (cost control) |
| `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/push-token` | Inbox + Expo token registration | authed |
| `POST /subscriptions/checkout` | Paystack init | authed; `501` if `PAYMENTS_ENABLED=false` |

Public/unauthenticated routes live under `/api/public/*`: `POST /public/paystack/webhook`, `POST /public/sms/status` (Twilio delivery callback, optional).

---

## 4. Health score (Pulse)

```text
score = round(
  0.30 * resolution_rate          // resolved / revealed entries
+ 0.25 * appreciation_ratio_norm  // min(appreciation:rant / 2, 1)
+ 0.25 * consistency              // cycles with >=1 entry from both / last 6
+ 0.20 * openness                 // avg entries per partner per cycle, capped
) * 100
```
Themes are clustered from entry text (voice entries use their transcript when available) via a single low-cost Groq LLM call (`llama-3.3-70b-versatile`) per cycle archival, not per entry. Severity = `High` at 6+ mentions, `Medium` at 3–5, `Low` below.

---

## 5. Screen map (React Navigation)

Superseded from the Expo Router recommendation in an earlier revision of this doc — the actual client uses **React Navigation** with a conventional `screens/` + `Navigations/` + `contexts/` + `services/` + `hooks/` + `types/` layout instead of file-based routing. `Frontend/src/Navigations/RootNavigator.tsx` is a three-way switch, not a route tree:

- **not authenticated** → `AuthStack` (Welcome → Login/Register)
- **authenticated, no pact yet** → `OnboardingStack` (Intention → Cycle → Invite → FirstDrop → Paired). Note the reordering versus the original screen list: `Cycle` (which creates the pact) has to precede `Invite` (which needs an existing pact to attach an invite to) — and `Cycle` doubles as the "join with a code" screen for the partner who didn't create the pact, since a joiner needs neither cycle settings nor an invite of their own.
- **authenticated + paired** → `MainNavigator`, a stack wrapping `MainTabs` (Home/Vault/Pulse/Pact as the 4 real tabs, rendered by a custom `BottomNav` component) plus modal/pushed screens: Drop, Reveal, Notifications, Talk, Therapist, Safety, Bonded.

`/screens` (the Lovable-era component index) and `/splash` as a routed screen are both dropped — splash is the app's loading state, not a navigable destination. Empty, loading, and error states remain in-screen variants.

---

## 6. Cost-conscious integrations

Every paid third party is wired through the same pattern: **the feature is fully implemented, but disabled by an env flag until you're ready to pay**, and the app boots and runs completely without any of these keys set.

| Concern | Provider | Cost posture |
|---|---|---|
| Voice transcription | OpenAI SDK client pointed at **Groq's** OpenAI-compatible endpoint (`whisper-large-v3`) | Groq's free tier covers early usage; same code path works against real OpenAI later by changing `TRANSCRIPTION_BASE_URL`. `TRANSCRIPTION_ENABLED=false` disables it entirely — voice notes still record and play. |
| AI tone-check + theme extraction | OpenAI SDK client pointed at **Groq's** OpenAI-compatible chat endpoint, `llama-3.3-70b-versatile` | Same free-tier Groq key as transcription — no separate account. Capped `max_tokens`, per-user daily rate limit on `/ai/tone-check`. |
| Payments | Paystack | No subscription fee — only a cut of real transactions; test-mode keys are free indefinitely. `PAYMENTS_ENABLED=false` disables checkout and exposes an internal manual-grant path for the `bonded` tier instead. |
| Push notifications | Expo Push API | Free, no account needed beyond an Expo project. |
| Partner invites | Link code (default, free) or Twilio SMS (`channel: sms`, optional, paid per message) | Link channel requires zero external accounts. |

---

## 7. What changed from the original draft, and why

- **Framework:** TanStack Start (web) → Expo Router (React Native). The actual client target is a native mobile app (confirmed by `CLIENT_ORIGIN=localhost:8081`, Metro's default port, and Expo push infra already present in the backend `.env`), not a responsive web app. Expo Router was chosen specifically because it preserves the file-based routing mental model from TanStack Start.
- **Security posture:** Postgres Row-Level Security → application-layer authorization. MongoDB has no RLS equivalent. The same guarantee ("a user can only ever touch rows in their own pact, and never another author's sealed entry") is enforced in layers instead of the database: JWT carries `pactId` → `requirePactMember` middleware loads the resource and checks pact ownership → every Mongoose query is additionally scoped by `pactId`/`authorId` at the service layer, so a bug in one layer doesn't expose data on its own.
- **`pact_member` dropped** as its own collection. With a hard cap of 2 partners, it added a join for no benefit — `Pact.partners` is a 2-element array instead. Therapist access was already modeled separately (`TherapistGrant`) and needed no login account, so it never needed the `pact_member` table either.
- **Therapists don't get a `User` account.** No email-sending infrastructure exists (Twilio is SMS-only) and adding one purely for therapist onboarding wasn't worth the cost or complexity. Instead, `grantTherapistAccess` issues a signed, short-expiry magic-link JWT that the partner shares manually; `/therapist/summary` accepts that token in place of a session. Revisit if therapist accounts become a paid tier feature.
- **`Session` entity added.** JWT refresh rotation and Expo push delivery both need a per-device record; neither existed in the original schema, which assumed a single implicit browser session.
- **Voice notes + transcription added to `Entry`.** The backend already had Cloudinary audio upload and an OpenAI dependency wired in before this doc was written — the schema was behind the code, not ahead of it.
- **Cron reframed as in-process (`node-cron`)** rather than an unspecified external "cron that flips `open → ready`" — there's no serverless platform in this stack to own that job. Flagged as the first thing to move to a real job queue (Agenda/BullMQ + Redis) if the app ever runs on more than one instance, since a second instance would double-fire the schedule.
