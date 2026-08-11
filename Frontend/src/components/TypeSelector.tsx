import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { EntryType } from '../types';
import { entryTypeColor, entryTypeLabel } from '../theme/tokens';

const TYPES: EntryType[] = ['rant', 'appreciation', 'request', 'observation'];

interface TypeSelectorProps {
  value: EntryType | null;
  onChange: (type: EntryType) => void;
}

/** 2x2 chip grid tinted by the four entry accents — Pact_Design_System.md §4. */
export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {TYPES.map((type) => {
        const selected = value === type;
        const color = entryTypeColor[type];
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            accessibilityRole="button"
            accessibilityLabel={entryTypeLabel[type]}
            style={{ borderColor: color, backgroundColor: selected ? `${color}22` : 'transparent' }}
            className="min-h-11 w-[47%] flex-row items-center gap-2 rounded-2xl border px-4 py-3"
          >
            <View style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-full" />
            <Text className="text-sm font-medium text-brand-ink">{entryTypeLabel[type]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
