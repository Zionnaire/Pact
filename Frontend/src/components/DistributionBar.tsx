import React from 'react';
import { View } from 'react-native';
import type { EntryType } from '../types';
import { entryTypeColor } from '../theme/tokens';

interface DistributionBarProps {
  distribution: Record<EntryType, number>;
}

const ORDER: EntryType[] = ['rant', 'appreciation', 'request', 'observation'];

/** Single 12px stacked bar in the four type colors — Pact_Design_System.md §4. */
export function DistributionBar({ distribution }: DistributionBarProps) {
  const total = ORDER.reduce((sum, type) => sum + distribution[type], 0) || 1;

  return (
    <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-brand-ink/5">
      {ORDER.map((type) => {
        const width = (distribution[type] / total) * 100;
        if (width === 0) return null;
        return <View key={type} style={{ width: `${width}%`, backgroundColor: entryTypeColor[type] }} />;
      })}
    </View>
  );
}
