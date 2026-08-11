import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PairAvatars } from './PairAvatars';
import type { User } from '../types';

interface HeroStatsCardProps {
  self: User;
  partner: User | null;
  pairedSince?: string;
  cycles: number;
  weekStreak: number;
  resolvedPct: number;
}

/** Dark plum hero panel on the Pact/Us screen — partners + at-a-glance stats. */
export function HeroStatsCard({ self, partner, pairedSince, cycles, weekStreak, resolvedPct }: HeroStatsCardProps) {
  return (
    <View
      className="overflow-hidden rounded-3xl"
      style={{ shadowColor: '#3A1218', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
    >
      <LinearGradient colors={['#5B1F24', '#3A1218']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24 }}>
        <LinearGradient
          pointerEvents="none"
          colors={['#D4AF3740', '#D4AF3700']}
          style={{ position: 'absolute', top: -70, right: -50, width: 180, height: 180, borderRadius: 90 }}
        />
        <View className="flex-row items-center justify-between gap-3">
          <PairAvatars self={self} partner={partner} size={40} />
          <View className="flex-shrink items-end">
            {pairedSince && (
              <Text numberOfLines={1} className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-gold">
                Paired since {pairedSince}
              </Text>
            )}
            <Text numberOfLines={1} className="mt-1 font-serif text-lg text-brand-paper">
              {self.displayName}
              {partner ? ` & ${partner.displayName}` : ''}
            </Text>
          </View>
        </View>

        <View className="mt-6 flex-row justify-between">
          <View>
            <Text className="font-serif text-2xl text-brand-gold">{cycles}</Text>
            <Text className="text-[11px] text-brand-paper/60">Cycles</Text>
          </View>
          <View>
            <Text className="font-serif text-2xl text-brand-gold">{weekStreak}</Text>
            <Text className="text-[11px] text-brand-paper/60">Week streak</Text>
          </View>
          <View>
            <Text className="font-serif text-2xl text-brand-gold">{resolvedPct}%</Text>
            <Text className="text-[11px] text-brand-paper/60">Resolved</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
