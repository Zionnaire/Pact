import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface StatTileProps {
  label: string;
  value: string | number;
  index?: number;
}

/** Uppercase micro-label + serif numeral — Pact_Design_System.md §4. */
export function StatTile({ label, value, index = 0 }: StatTileProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(450).springify().damping(16)}
      className="flex-1 rounded-2xl bg-white p-4 ring-1 ring-brand-ink/5"
      style={{
        shadowColor: '#1E1E1E',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <Text numberOfLines={1} className="text-[9px] font-sans-semibold uppercase tracking-[0.08em] text-brand-clay">
        {label}
      </Text>
      <Text className="mt-1 font-serif text-3xl text-brand-plum" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </Animated.View>
  );
}
