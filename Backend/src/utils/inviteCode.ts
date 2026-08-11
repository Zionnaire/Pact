/**
 * utils/inviteCode.ts
 * Short, human-typeable pairing codes (e.g. "PACT-7K3F9Q").
 * Excludes visually ambiguous characters (0/O, 1/I/L).
 */

import crypto from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateInviteCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `PACT-${code}`;
}
