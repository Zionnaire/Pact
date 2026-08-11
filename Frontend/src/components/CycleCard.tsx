import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { Cycle } from '../types';

function formatCountdown(revealAt: string): string {
  const diffMs = new Date(revealAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Ready to reveal';

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h until reveal`;
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m until reveal`;
}

interface CycleCardProps {
  cycle: Cycle | null;
  sealedCounts: Record<string, number>;
  partnerLabel?: string;
}

/** Plum hero panel with a gold radial bloom — Pact_Design_System.md §4. */
export function CycleCard({ cycle, sealedCounts }: CycleCardProps) {
  const [countdown, setCountdown] = useState(() => (cycle ? formatCountdown(cycle.revealAt) : ''));

  useEffect(() => {
    if (!cycle) return;
    const interval = setInterval(() => setCountdown(formatCountdown(cycle.revealAt)), 60000);
    return () => clearInterval(interval);
  }, [cycle]);

  const totalSealed = Object.values(sealedCounts).reduce((sum, n) => sum + n, 0);

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      className="overflow-hidden rounded-3xl"
      style={{
        shadowColor: '#3A1218',
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={['#5B1F24', '#3A1218']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 24 }}
      >
        {/* Radial gold bloom, clipped by the parent's rounded corners */}
        <LinearGradient
          pointerEvents="none"
          colors={['#D4AF3755', '#D4AF3700']}
          style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: 110,
          }}
        />

        <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-gold">
          {cycle ? `Cycle ${cycle.index + 1}` : 'No active cycle'}
        </Text>
        <Text className="mt-2 font-serif text-3xl text-brand-paper">
          {cycle ? countdown : 'Create a pact to begin'}
        </Text>
        {cycle && (
          <Text className="mt-3 text-sm text-brand-paper/70">
            {totalSealed} sealed {totalSealed === 1 ? 'entry' : 'entries'} this cycle
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
}
