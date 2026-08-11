import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { Entry } from '../types';
import { entryTypeColor, entryTypeLabel } from '../theme/tokens';

interface EntryCardProps {
  entry: Entry;
  showBody?: boolean;
  index?: number;
  /** Slower, more deliberate per-card delay — used for the reveal ceremony. */
  ceremonial?: boolean;
  /** "FROM TUNDE" / "FROM YOU" — shown next to the type badge during reveal. */
  fromLabel?: string;
  children?: React.ReactNode;
}

/** White card with a colored type accent edge — Pact_Design_System.md §4. */
export function EntryCard({ entry, showBody = true, index = 0, ceremonial = false, fromLabel, children }: EntryCardProps) {
  const color = entryTypeColor[entry.type];
  const staggerMs = ceremonial ? 220 : 60;
  const capped = ceremonial ? 10 : 8;

  return (
    <Animated.View
      entering={
        ceremonial
          ? FadeInUp.delay(Math.min(index, capped) * staggerMs).duration(550).springify().damping(15)
          : FadeInUp.delay(Math.min(index, capped) * staggerMs).duration(450)
      }
      className="mb-3 flex-row overflow-hidden rounded-2xl bg-white"
      style={{
        shadowColor: '#1E1E1E',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <View style={{ backgroundColor: color, width: 4 }} />
      <View className="flex-1 p-4">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View style={{ backgroundColor: color }} className="h-2 w-2 rounded-full" />
            <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">
              {entryTypeLabel[entry.type]}
            </Text>
            {entry.mood && <Text className="text-[11px] text-brand-ink/40">· {entry.mood}</Text>}
          </View>
          {fromLabel && (
            <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.15em] text-brand-ink/30">{fromLabel}</Text>
          )}
        </View>

        {showBody && entry.body && <Text className="text-[15px] leading-6 text-brand-ink/90">{entry.body}</Text>}

        {showBody && entry.audioUrl && !entry.body && (
          <Text className="text-[13px] italic text-brand-ink/50">
            {entry.transcriptStatus === 'done' && entry.transcript
              ? entry.transcript
              : 'Voice note — tap to play'}
          </Text>
        )}

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <View
                key={step}
                className={`h-1.5 w-4 rounded-full ${step <= entry.intensity ? 'bg-brand-plum' : 'bg-brand-ink/10'}`}
              />
            ))}
          </View>
          <Text className="text-[10px] text-brand-ink/40">
            {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {children && <View className="mt-3 gap-3">{children}</View>}
      </View>
    </Animated.View>
  );
}
