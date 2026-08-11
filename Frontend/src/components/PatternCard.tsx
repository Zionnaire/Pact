import React from 'react';
import { View, Text } from 'react-native';
import type { Theme } from '../types';

interface PatternCardProps {
  theme: Theme;
}

/** "PATTERN NOTICED" insight card, sourced from the top recurring theme. */
export function PatternCard({ theme }: PatternCardProps) {
  const cycles = theme.mentionCount === 1 ? 'cycle' : 'cycles';

  return (
    <View className="rounded-2xl border border-type-rant/30 bg-type-rant/10 p-4">
      <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-type-rant">Pattern noticed</Text>
      <Text className="mt-1.5 text-[13px] leading-5 text-brand-ink/80">
        “{theme.name}” has surfaced {theme.mentionCount === 1 ? 'once' : `${theme.mentionCount} times`} across your last few {cycles}.
      </Text>
    </View>
  );
}
