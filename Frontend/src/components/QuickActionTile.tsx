import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionTileProps {
  eyebrow: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

/** "QUICK / Check-in", "VOICE / Speak it" — Home screen quick-action row. */
export function QuickActionTile({ eyebrow, label, icon, onPress }: QuickActionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-11 flex-1 flex-row items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-brand-ink/5 active:opacity-80"
    >
      <View>
        <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-clay">{eyebrow}</Text>
        <Text className="mt-1 text-[14px] text-brand-ink">{label}</Text>
      </View>
      <Ionicons name={icon} size={18} color="#C36341" />
    </Pressable>
  );
}
