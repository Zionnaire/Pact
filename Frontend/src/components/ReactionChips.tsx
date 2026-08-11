import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ReactionKind } from '../types';

const OPTIONS: { value: ReactionKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'understood', label: 'Understood', icon: 'checkmark-circle-outline' },
  { value: 'surprised', label: 'Surprised', icon: 'sparkles-outline' },
  { value: 'need_clarity', label: 'Need clarity', icon: 'help-circle-outline' },
];

interface ReactionChipsProps {
  value?: ReactionKind;
  onChange: (reaction: ReactionKind) => void;
}

/** "How does this land" quick reaction row, shown on revealed entries. */
export function ReactionChips({ value, onChange }: ReactionChipsProps) {
  return (
    <View>
      <Text className="mb-1.5 text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-ink/40">
        How does this land
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              className="min-h-11 flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: selected ? '#5B1F24' : 'rgba(30,30,30,0.05)' }}
            >
              <Ionicons name={option.icon} size={13} color={selected ? '#F9F7F2' : 'rgba(30,30,30,0.6)'} />
              <Text style={{ color: selected ? '#F9F7F2' : 'rgba(30,30,30,0.6)' }} className="text-[12px]">
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
