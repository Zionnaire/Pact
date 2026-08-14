/**
 * controllers/legal.controller.ts
 * Publicly served legal pages — required by both the Google Play Data
 * Safety form and Apple App Store Connect (a live, non-geofenced privacy
 * policy URL), plus a plain-language account-deletion page for Google's
 * "web deletion request" field. Plain HTML, no auth, no build step.
 *
 * This is a solid starting draft reflecting what Pact actually does — not
 * a substitute for a lawyer's review before shipping to real users.
 */

import { Request, Response } from 'express';

const SUPPORT_EMAIL = 'support@pact.app';

const PAGE_STYLE = `
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 32px 20px 80px; color: #1E1E1E; line-height: 1.6; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 32px; }
  p, li { font-size: 15px; color: #3A3A3A; }
  .updated { color: #888; font-size: 13px; margin-bottom: 32px; }
  a { color: #5B1F24; }
`;

function page(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Pact</title><style>${PAGE_STYLE}</style></head><body>${body}</body></html>`;
}

export const privacyPolicy = (_req: Request, res: Response) => {
  res.type('html').send(page('Privacy Policy', `
    <h1>Pact Privacy Policy</h1>
    <p class="updated">Last updated: ${new Date().toISOString().slice(0, 10)}</p>

    <p>Pact is a private journaling app for couples. Entries you write stay sealed — invisible to your partner and to us in any meaningful sense beyond automated storage — until you and your partner mutually reveal a cycle together. This page explains what we collect and why.</p>

    <h2>What we collect</h2>
    <ul>
      <li><strong>Account info:</strong> display name, email or phone number, and a password (stored as a one-way hash — we never see or store your actual password).</li>
      <li><strong>Journal entries:</strong> text and/or voice recordings you write or record, their type, mood, and intensity — stored sealed until your mutual reveal.</li>
      <li><strong>Profile photo:</strong> if you choose to add one, stored via Cloudinary.</li>
      <li><strong>Usage data:</strong> cycle/reveal timestamps, pulse scores, and recurring themes, computed from your entries to show you relationship trends.</li>
    </ul>

    <h2>Third parties we use</h2>
    <ul>
      <li><strong>MongoDB Atlas</strong> — database hosting.</li>
      <li><strong>Cloudinary</strong> — stores voice recordings and profile photos.</li>
      <li><strong>Groq</strong> — powers two opt-in AI features: a "tone check" that suggests a softer rewrite of a draft entry before you seal it, and (if enabled) voice-note transcription. Entry text sent for a tone check is not stored by us beyond the request.</li>
      <li><strong>Expo</strong> — delivers push notifications and app updates.</li>
    </ul>
    <p>We do not sell your data, run ads, or use advertising/tracking SDKs.</p>

    <h2>Who can see your entries</h2>
    <p>Nobody — not even us — reads your sealed entries as a matter of course. Your partner sees an entry only after you both consent to reveal that cycle. If you grant a therapist read-only access (an opt-in feature), they see aggregate summaries and themes only, never raw entry text.</p>

    <h2>Your data, your control</h2>
    <p>You can delete your account and personal data at any time from Pact → Settings → Delete account. This removes your personal identifiers and any entries that were never mutually revealed. See <a href="/api/public/legal/account-deletion">this page</a> for details, including how to request deletion if you no longer have app access.</p>

    <h2>Contact</h2>
    <p>Questions about this policy or your data: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
  `));
};

export const termsOfService = (_req: Request, res: Response) => {
  res.type('html').send(page('Terms of Service', `
    <h1>Pact Terms of Service</h1>
    <p class="updated">Last updated: ${new Date().toISOString().slice(0, 10)}</p>

    <p>By using Pact, you agree to these terms.</p>

    <h2>The basics</h2>
    <p>Pact is a private journaling tool for two partners. You're responsible for what you write, and for keeping your account credentials secure.</p>

    <h2>What Pact is not</h2>
    <p>Pact is not a substitute for professional therapy or crisis support. If you or your partner are in crisis, please use the resources in Pact → Settings → Safety & support, or contact local emergency services.</p>

    <h2>Account & content</h2>
    <p>You must be old enough to consent to a data-processing agreement in your jurisdiction (generally 13+, though we recommend Pact for adults navigating an established relationship). You own the content you write; sealing an entry means it stays private until you and your partner mutually reveal it.</p>

    <h2>Termination</h2>
    <p>You may delete your account at any time (Pact → Settings → Delete account). We may suspend accounts used to violate these terms or applicable law.</p>

    <h2>Contact</h2>
    <p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
  `));
};

export const accountDeletionInfo = (_req: Request, res: Response) => {
  res.type('html').send(page('Delete your account', `
    <h1>Delete your Pact account</h1>

    <h2>In the app (fastest)</h2>
    <p>Open Pact → tap the menu icon → <strong>Settings</strong> → <strong>Delete account</strong> → confirm with your password. This immediately:</p>
    <ul>
      <li>Removes your name, email/phone, and profile photo</li>
      <li>Permanently deletes any entries you wrote that were never mutually revealed to your partner</li>
      <li>Signs you out on every device</li>
    </ul>
    <p>Entries that were already mutually revealed remain part of your (former) partner's own history, since both of you already saw them together — deleting your account doesn't retroactively unshare something you both already consented to reveal.</p>

    <h2>No app access?</h2>
    <p>Email <a href="mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request">${SUPPORT_EMAIL}</a> from the address on your account (or include your registered phone number) with the subject "Account deletion request." We'll process it within 30 days and confirm by email.</p>

    <p style="margin-top:32px"><a href="/api/public/legal/privacy">Privacy Policy</a> · <a href="/api/public/legal/terms">Terms of Service</a></p>
  `));
};
