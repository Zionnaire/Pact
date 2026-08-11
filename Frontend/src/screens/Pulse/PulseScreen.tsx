import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Screen, AppHeader, StatTile, ProgressBar, DistributionBar, SkeletonLoader, EmptyState } from '../../components';
import { usePulse } from '../../hooks';
import { usePact } from '../../contexts/PactContext';
import { colors, entryTypeColor, entryTypeLabel } from '../../theme/tokens';
import { IMAGES } from '../../theme/images';
import type { EntryType } from '../../types';

const SEVERITY_COLOR: Record<string, string> = {
  High: colors.typeRant,
  Medium: colors.typeNeed,
  Low: colors.typeNote,
};

const ENTRY_TYPES: EntryType[] = ['appreciation', 'rant', 'request', 'observation'];

function scoreLine(score: number): string {
  if (score >= 70) return "You're getting better at this.";
  if (score >= 40) return 'Steady as you go.';
  return 'Room to grow together.';
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="mb-4">
      <View className="mb-1.5 flex-row justify-between">
        <Text className="text-[12px] text-brand-ink/60">{label}</Text>
        <Text className="text-[12px] text-brand-ink/60">{Math.round(value * 100)}</Text>
      </View>
      <ProgressBar progress={value} />
    </View>
  );
}

export function PulseScreen() {
  const { data: pulse, isLoading } = usePulse();
  const { snapshot } = usePact();

  const totalEntries = pulse ? Object.values(pulse.distribution).reduce((a, b) => a + b, 0) : 0;
  const appreciationRatio = pulse && pulse.distribution.rant > 0
    ? (pulse.distribution.appreciation / pulse.distribution.rant).toFixed(1)
    : pulse?.distribution.appreciation ? `${pulse.distribution.appreciation}` : '—';

  return (
    <Screen>
      <AppHeader title="Pulse" />
      <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Relationship health</Text>

      {isLoading && <SkeletonLoader height={140} className="my-4" />}

      {!isLoading && pulse && (
        <>
          <Animated.View entering={FadeIn.duration(400)} className="mt-2 flex-row items-baseline">
            <Text className="font-serif text-6xl text-brand-plum">{pulse.score}</Text>
            <Text className="ml-1 text-[15px] text-brand-ink/40">/100</Text>
          </Animated.View>
          <Text className="mt-1 text-[13px] italic text-brand-ink/50">{scoreLine(pulse.score)}</Text>

          <View className="mt-6">
            <BreakdownRow label="Resolution" value={pulse.resolutionRate} />
            <BreakdownRow label="Appreciation" value={pulse.appreciationRatioNorm} />
            <BreakdownRow label="Consistency" value={pulse.consistency} />
            <BreakdownRow label="Openness" value={pulse.openness} />
          </View>

          <View className="flex-row flex-wrap gap-3">
            <StatTile label="Entries" value={totalEntries} index={0} />
            <StatTile label="Resolution" value={`${Math.round(pulse.resolutionRate * 100)}%`} index={1} />
            <StatTile label="Appreciation" value={`${appreciationRatio}:1`} index={2} />
            <StatTile label="Streak" value={`${snapshot?.streak ?? 0}wk`} index={3} />
          </View>

          <Text className="mb-2 mt-8 font-serif text-lg text-brand-ink">Emotional distribution</Text>
          <DistributionBar distribution={pulse.distribution} />
          <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
            {ENTRY_TYPES.map((type) => (
              <View key={type} className="flex-row items-center gap-1.5">
                <View style={{ backgroundColor: entryTypeColor[type] }} className="h-2 w-2 rounded-full" />
                <Text className="text-[11px] text-brand-ink/50">
                  {entryTypeLabel[type]} {totalEntries > 0 ? Math.round((pulse.distribution[type] / totalEntries) * 100) : 0}%
                </Text>
              </View>
            ))}
          </View>

          <Text className="mb-3 mt-8 font-serif text-lg text-brand-ink">Recurring themes</Text>
          {pulse.themes.length === 0 && (
            <EmptyState
              icon="sparkles-outline"
              imageUrl={IMAGES.journalWriting}
              title="No themes yet"
              description="Themes emerge after a few cycles of revealed entries."
            />
          )}
          {pulse.themes.map((theme, index) => (
            <Animated.View
              key={theme._id}
              entering={FadeInUp.delay(index * 60).duration(350)}
              className="mb-2 flex-row items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-brand-ink/5"
            >
              <Text className="flex-1 text-[14px] text-brand-ink">{theme.name}</Text>
              <View className="flex-row items-center gap-2">
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${SEVERITY_COLOR[theme.severity]}22` }}>
                  <Text style={{ color: SEVERITY_COLOR[theme.severity] }} className="text-[9px] font-sans-semibold uppercase">
                    {theme.severity}
                  </Text>
                </View>
                <Text className="text-[11px] text-brand-ink/40">{theme.mentionCount}×</Text>
              </View>
            </Animated.View>
          ))}

          <Text className="mb-3 mt-8 font-serif text-lg text-brand-ink">Cycle history</Text>
          {pulse.history.length === 0 && <Text className="text-[13px] text-brand-ink/40">No revealed cycles yet.</Text>}
          {pulse.history.map((h) => (
            <View key={h.cycleIndex} className="mb-2 flex-row items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-brand-ink/5">
              <Text className="text-[13px] text-brand-ink">
                {new Date(h.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(h.revealAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' · '}
                <Text className="text-brand-ink/40">{h.entryCount} entries</Text>
              </Text>
              <Text className="text-[13px] font-sans-semibold text-brand-plum">{h.resolvedPct}%</Text>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
