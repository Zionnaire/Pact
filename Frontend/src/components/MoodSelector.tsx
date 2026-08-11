import React from 'react';
import { View, Text, Pressable } from 'react-native';

const MOODS = ['Hurt', 'Frustrated', 'Grateful', 'Confused', 'Hopeful', 'Tender', 'Anxious', 'Proud'];

interface MoodSelectorProps {
  value: string;
  onChange: (mood: string) => void;
}

/** Preset mood chips — Pact_Design_System.md §4 (Drop screen). */
export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <View>
      <Text className="mb-1.5 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Mood</Text>
      <View className="flex-row flex-wrap gap-2">
        {MOODS.map((mood) => {
          const selected = value === mood;
          return (
            <Pressable
              key={mood}
              onPress={() => onChange(selected ? '' : mood)}
              accessibilityRole="button"
              accessibilityLabel={mood}
              className="min-h-11 rounded-full px-3.5 py-2"
              style={{ backgroundColor: selected ? '#5B1F24' : 'rgba(30,30,30,0.05)' }}
            >
              <Text style={{ color: selected ? '#F9F7F2' : 'rgba(30,30,30,0.6)' }} className="text-[13px]">
                {mood}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
