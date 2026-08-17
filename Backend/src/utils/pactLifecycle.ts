/**
 * utils/pactLifecycle.ts
 * Shared "this pact is over" cascade — used by both voluntarily leaving a
 * pact and deleting your account, since both need the identical
 * data-safety handling: unrevealed entries you authored are gone (never
 * consented to be seen, can now never be revealed), the pact is marked
 * ended, and the other partner is notified but not blocked from anything.
 */

import { Types } from 'mongoose';
import { IPact } from '../models/Pact.model';
import { Cycle } from '../models/Cycle.model';
import { Entry } from '../models/Entry.model';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import { cloudinary } from '../configs/cloudinary';
import { logger } from '../utils/logger';

/**
 * Ends `pact` on behalf of `userId` — deletes their own unrevealed entries,
 * marks the pact ended, notifies the other partner. Does NOT touch
 * `userId`'s own User document (caller decides: deleteAccount anonymizes
 * it, leavePact just clears pactId) — see auth.controller.ts /
 * pact.controller.ts.
 */
export async function endPactForUser(pact: IPact, userId: Types.ObjectId): Promise<void> {
  const unrevealedCycles = await Cycle.find({ pactId: pact._id, status: { $in: ['open', 'ready'] } }).select('_id');
  const unrevealedCycleIds = unrevealedCycles.map((c) => c._id);

  const ownUnrevealedEntries = await Entry.find({
    cycleId: { $in: unrevealedCycleIds },
    authorId: userId,
  }).select('audioPublicId');

  for (const entry of ownUnrevealedEntries) {
    if (entry.audioPublicId) {
      await cloudinary.uploader.destroy(entry.audioPublicId, { resource_type: 'video' }).catch((err) => {
        logger.error(`Failed to delete Cloudinary audio ${entry.audioPublicId} while ending pact ${pact._id}:`, err);
      });
    }
  }
  await Entry.deleteMany({ cycleId: { $in: unrevealedCycleIds }, authorId: userId });

  pact.status = 'ended';
  await pact.save();

  const partnerId = pact.partners.find((id) => !id.equals(userId));
  if (partnerId) {
    await Notification.create({
      userId: partnerId,
      kind: 'partner_left',
      payload: { pactId: pact._id },
    });
  }
}

/**
 * Clears pactId for whoever's still pointing at an already-`ended` pact —
 * the remaining partner never had their own pactId cleared when the other
 * side left (they still have real history to read there), so without this
 * they'd be permanently stuck: createPact rejects anyone with a pactId set,
 * even one pointing at a dead pact. Call this before starting/joining a new
 * pact if the user's current one has already ended.
 */
export async function clearStalePactId(userId: Types.ObjectId): Promise<void> {
  await User.updateOne({ _id: userId }, { $unset: { pactId: '' } });
}
