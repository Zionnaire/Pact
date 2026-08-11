import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ResolutionStatus } from '../types';

interface ResolutionRowProps {
  value: ResolutionStatus | null;
  onChange: (status: ResolutionStatus) => void;
  onScheduleTalk: () => void;
}

/** Resolved / Ongoing status pills + a "Schedule talk" shortcut. */
export function ResolutionRow({ value, onChange, onScheduleTalk }: ResolutionRowProps) {
  return (
    <View>
      <Text className="mb-1.5 text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-ink/40">Resolution</Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => onChange('resolved')}
          className="min-h-11 rounded-full px-3.5 py-2"
          style={{ backgroundColor: value === 'resolved' ? '#83C5BE' : 'rgba(30,30,30,0.05)' }}
        >
          <Text style={{ color: value === 'resolved' ? '#14090B' : 'rgba(30,30,30,0.6)' }} className="text-[12px]">
            Resolved
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange('talking')}
          className="min-h-11 rounded-full px-3.5 py-2"
          style={{ backgroundColor: value === 'talking' ? '#E29578' : 'rgba(30,30,30,0.05)' }}
        >
          <Text style={{ color: value === 'talking' ? '#3A1218' : 'rgba(30,30,30,0.6)' }} className="text-[12px]">
            Ongoing
          </Text>
        </Pressable>
        <Pressable onPress={onScheduleTalk} className="min-h-11 rounded-full bg-brand-ink/5 px-3.5 py-2">
          <Text className="text-[12px] text-brand-clay">Schedule talk</Text>
        </Pressable>
      </View>
    </View>
  );
}
