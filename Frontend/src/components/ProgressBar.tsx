import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-1
}

/** 6px track at ink/5, plum fill — Pact_Design_System.md §4. */
export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View className="h-1.5 w-full overflow-hidden rounded-full bg-brand-ink/5">
      <View className="h-full rounded-full bg-brand-plum" style={{ width: `${clamped * 100}%` }} />
    </View>
  );
}
