/**
 * utils/pulseScore.ts
 * Pure computation of the Pulse health score.
 * score = 0.30*resolutionRate + 0.25*appreciationRatioNorm + 0.25*consistency + 0.20*openness, scaled to 0-100.
 * See Pact_System_Design.md §4.
 */

export interface PulseInputs {
  resolvedCount: number;
  revealedEntryCount: number;
  appreciationCount: number;
  rantCount: number;
  cyclesWithBothPartners: number;
  cyclesConsidered: number;
  avgEntriesPerPartnerPerCycle: number;
}

export interface PulseBreakdown {
  score: number;
  resolutionRate: number;
  appreciationRatioNorm: number;
  consistency: number;
  openness: number;
}

const OPENNESS_CAP = 4;

export function computePulseScore(inputs: PulseInputs): PulseBreakdown {
  const resolutionRate = inputs.revealedEntryCount > 0
    ? inputs.resolvedCount / inputs.revealedEntryCount
    : 0;

  const appreciationRatioNorm = inputs.rantCount > 0
    ? Math.min(inputs.appreciationCount / inputs.rantCount / 2, 1)
    : inputs.appreciationCount > 0 ? 1 : 0;

  const consistency = inputs.cyclesConsidered > 0
    ? inputs.cyclesWithBothPartners / inputs.cyclesConsidered
    : 0;

  const openness = Math.min(inputs.avgEntriesPerPartnerPerCycle / OPENNESS_CAP, 1);

  const raw = 0.30 * resolutionRate
    + 0.25 * appreciationRatioNorm
    + 0.25 * consistency
    + 0.20 * openness;

  return {
    score: Math.round(raw * 100),
    resolutionRate,
    appreciationRatioNorm,
    consistency,
    openness,
  };
}

export function classifyThemeSeverity(mentionCount: number): 'High' | 'Medium' | 'Low' {
  if (mentionCount >= 6) return 'High';
  if (mentionCount >= 3) return 'Medium';
  return 'Low';
}
