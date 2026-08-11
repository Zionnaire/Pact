import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DropMode } from '../types';

const OPTIONS: { mode: DropMode; icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { mode: 'standard', icon: 'lock-closed', title: 'Standard', description: 'Revealed with the cycle.' },
  { mode: 'anonymous', icon: 'eye-off', title: 'Anonymous', description: "No name attached at reveal." },
  { mode: 'urgent', icon: 'flash', title: 'Urgent', description: 'Unlocks a same-day nudge.' },
];

interface DropModeSelectorProps {
  value: DropMode;
  onChange: (mode: DropMode) => void;
}

/** Standard / Anonymous / Urgent — see Pact_System_Design.md §1 (Entry.dropMode). */
export function DropModeSelector({ value, onChange }: DropModeSelectorProps) {
  return (
    <View className="gap-2">
      {OPTIONS.map((option) => {
        const selected = value === option.mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => onChange(option.mode)}
            accessibilityRole="button"
            accessibilityLabel={option.title}
            className="min-h-11 flex-row items-center gap-3 rounded-2xl bg-white p-3"
            style={{ borderWidth: 1, borderColor: selected ? '#5B1F24' : 'rgba(30,30,30,0.08)' }}
          >
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: selected ? '#5B1F24' : 'rgba(30,30,30,0.05)' }}
            >
              <Ionicons name={option.icon} size={16} color={selected ? '#F9F7F2' : '#1E1E1E'} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] text-brand-ink">{option.title}</Text>
              <Text className="text-[12px] text-brand-ink/50">{option.description}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
