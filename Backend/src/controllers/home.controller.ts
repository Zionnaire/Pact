import { Request, Response } from 'express';
import { Pact } from '../models/Pact.model';
import { Cycle } from '../models/Cycle.model';
import { Entry } from '../models/Entry.model';
import { Theme } from '../models/Theme.model';
import { Talk } from '../models/Talk.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

async function bothPartnersDropped(cycleId: unknown, partners: unknown[]): Promise<boolean> {
  const authorIds = await Entry.distinct('authorId', { cycleId });
  return partners.every((p) => authorIds.some((a) => a.toString() === (p as { toString(): string }).toString()));
}

export const getHomeSnapshot = asyncHandler(async (req: Request, res: Response) => {
  const pact = await Pact.findById(req.pactId);
  if (!pact) throw ApiError.notFound('Pact not found');

  const cycle = pact.currentCycleId ? await Cycle.findById(pact.currentCycleId) : null;

  // Only the caller's own count — the partner's is never sent while the
  // cycle is unrevealed, in either direction. A combined total would still
  // let the client derive the partner's count by subtraction, which is the
  // same leak with extra steps: the vault mechanic has to hold at the API
  // boundary, not just in what the UI chooses to render.
  let sealedCounts: Record<string, number> = {};
  if (cycle) {
    const myCount = await Entry.countDocuments({ cycleId: cycle._id, authorId: req.user!._id });
    sealedCounts = { [req.user!._id.toString()]: myCount };
  }

  // Streak = consecutive archived cycles, most recent first, where both
  // partners dropped at least one entry.
  const archivedCycles = await Cycle.find({ pactId: pact._id, status: 'archived' })
    .sort({ index: -1 })
    .limit(52);

  let streak = 0;
  for (const c of archivedCycles) {
    // eslint-disable-next-line no-await-in-loop
    const bothDropped = await bothPartnersDropped(c._id, pact.partners);
    if (!bothDropped) break;
    streak += 1;
  }

  const [topTheme, recentEntries, nextTalk, lastCycle] = await Promise.all([
    Theme.findOne({ pactId: pact._id }).sort({ mentionCount: -1 }),
    Entry.find({ authorId: req.user!._id, pactId: pact._id }).sort({ createdAt: -1 }).limit(5),
    Talk.findOne({ pactId: pact._id, status: 'scheduled', scheduledFor: { $gte: new Date() } }).sort({ scheduledFor: 1 }),
    Cycle.findOne({ pactId: pact._id, status: { $in: ['revealed', 'archived'] } }).sort({ index: -1 }),
  ]);

  let lastCyclePreview: { cycle: typeof lastCycle; entries: unknown[] } | null = null;
  if (lastCycle) {
    const previewEntries = await Entry.find({ cycleId: lastCycle._id })
      .sort({ createdAt: -1 })
      .limit(2)
      .populate('authorId', 'displayName avatarInitial');

    lastCyclePreview = {
      cycle: lastCycle,
      entries: previewEntries.map((entry) => {
        const json = entry.toJSON() as Record<string, unknown>;
        if (entry.dropMode === 'anonymous' && entry.authorId.toString() !== req.user!._id.toString()) {
          json.authorId = null;
        }
        return json;
      }),
    };
  }

  // Populated after the streak check above, which needs raw ObjectIds —
  // populating first would break the .toString() comparison in
  // bothPartnersDropped. The client needs partner displayName/avatar to
  // render anything beyond a bare count (PactScreen, RevealScreen).
  await pact.populate('partners', 'displayName avatarUrl avatarInitial');

  res.json(new ApiResponse(200, 'Home snapshot', {
    pact,
    cycle,
    sealedCounts,
    streak,
    topTheme,
    recentEntries,
    nextTalk,
    lastCyclePreview,
  }));
});
