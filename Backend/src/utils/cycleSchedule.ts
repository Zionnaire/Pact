/**
 * utils/cycleSchedule.ts
 * Timezone-aware reveal-time math for cycles, via luxon (plain Date math
 * cannot correctly apply a pact's local wall-clock time or DST).
 *
 * revealDay is treated as a UI/scheduling hint for the common 7-day cycle;
 * the reveal instant itself is always `startsAt + cycleLengthDays`, with
 * the clock time pinned to revealTime in the pact's timezone. Cycle lengths
 * that aren't multiples of 7 make "day of week" ambiguous, so it's not
 * enforced in the interval math.
 */

import { DateTime } from 'luxon';

export function computeCycleRevealAt(params: {
  timezone: string;
  revealTime: string;
  startsAt: Date;
  cycleLengthDays: number;
}): Date {
  const [hour, minute] = params.revealTime.split(':').map(Number);

  return DateTime.fromJSDate(params.startsAt, { zone: params.timezone })
    .plus({ days: params.cycleLengthDays })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toJSDate();
}
