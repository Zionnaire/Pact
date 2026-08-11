import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface IntensityMeterProps {
  value: number;
  onChange: (value: number) => void;
}

/** 5-step segmented bar, plum fill — Pact_Design_System.md §4. */
export function IntensityMeter({ value, onChange }: IntensityMeterProps) {
  return (
    <View>
      <Text className="mb-2 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Intensity</Text>
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <Pressable
            key={step}
            onPress={() => onChange(step)}
            accessibilityRole="button"
            accessibilityLabel={`Intensity ${step} of 5`}
            className="h-2.5 flex-1 rounded-full"
            style={{ backgroundColor: step <= value ? '#5B1F24' : 'rgba(30,30,30,0.05)' }}
          />
        ))}
      </View>
    </View>
  );
}
