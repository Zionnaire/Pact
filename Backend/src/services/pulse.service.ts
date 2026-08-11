/**
 * services/pulse.service.ts
 * Shared aggregate-only Pulse computation, used by both the partner-facing
 * /pulse endpoint and the therapist summary endpoint. Never touches entry
 * body/transcript text — only counts, types, and dates (Pact_System_Design.md
 * invariant 5: therapists never read entry content).
 */

import { Cycle } from '../models/Cycle.model';
import { Entry, EntryType } from '../models/Entry.model';
import { Resolution } from '../models/Resolution.model';
import { Theme } from '../models/Theme.model';
import { computePulseScore, PulseBreakdown } from '../utils/pulseScore';

const CYCLES_CONSIDERED = 6;
const ENTRY_TYPES: EntryType[] = ['rant', 'appreciation', 'request', 'observation'];

export interface PulseSummary extends PulseBreakdown {
  distribution: Record<EntryType, number>;
  themes: Awaited<ReturnType<typeof Theme.find>>;
  history: Array<{
    cycleIndex: number;
    startsAt: Date;
    revealAt: Date;
    entryCount: number;
    resolvedPct: number;
    revealedAt?: Date;
  }>;
}

export async function computePactPulse(pactId: string): Promise<PulseSummary> {
  const cycles = await Cycle.find({ pactId, status: { $in: ['revealed', 'archived'] } })
    .sort({ index: -1 })
    .limit(CYCLES_CONSIDERED);

  const cycleIds = cycles.map((c) => c._id);
  const entries = await Entry.find({ cycleId: { $in: cycleIds } }).select('cycleId authorId type');
  const entryIds = entries.map((e) => e._id);

  const resolutions = await Resolution.find({ entryId: { $in: entryIds } }).select('entryId status');
  const resolvedEntryIds = new Set(
    resolutions.filter((r) => r.status === 'resolved').map((r) => r.entryId.toString()),
  );
  const resolvedCount = resolvedEntryIds.size;

  const entriesByCycle = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = e.cycleId.toString();
    entriesByCycle.set(key, [...(entriesByCycle.get(key) || []), e]);
  }

  let cyclesWithBothPartners = 0;
  for (const cycle of cycles) {
    const cycleEntries = entriesByCycle.get(cycle._id.toString()) || [];
    const authorIds = new Set(cycleEntries.map((e) => e.authorId.toString()));
    if (authorIds.size >= 2) cyclesWithBothPartners += 1;
  }

  const distribution = Object.fromEntries(
    ENTRY_TYPES.map((type) => [type, entries.filter((e) => e.type === type).length]),
  ) as Record<EntryType, number>;

  const breakdown = computePulseScore({
    resolvedCount,
    revealedEntryCount: entries.length,
    appreciationCount: distribution.appreciation,
    rantCount: distribution.rant,
    cyclesWithBothPartners,
    cyclesConsidered: cycles.length,
    avgEntriesPerPartnerPerCycle: cycles.length > 0 ? entries.length / (2 * cycles.length) : 0,
  });

  const themes = await Theme.find({ pactId }).sort({ mentionCount: -1 }).limit(10);

  const history = cycles
    .slice()
    .reverse()
    .map((cycle) => {
      const cycleEntries = entriesByCycle.get(cycle._id.toString()) || [];
      const resolvedInCycle = cycleEntries.filter((e) => resolvedEntryIds.has(e._id.toString())).length;
      return {
        cycleIndex: cycle.index,
        startsAt: cycle.startsAt,
        revealAt: cycle.revealAt,
        entryCount: cycleEntries.length,
        resolvedPct: cycleEntries.length > 0 ? Math.round((resolvedInCycle / cycleEntries.length) * 100) : 0,
        revealedAt: cycle.revealedAt,
      };
    });

  return { ...breakdown, distribution, themes, history };
}
