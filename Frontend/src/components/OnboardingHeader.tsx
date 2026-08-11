import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface OnboardingHeaderProps {
  step: number;
  totalSteps?: number;
  onSkip?: () => void;
}

/** Back arrow + segmented progress + optional skip — every onboarding step. */
export function OnboardingHeader({ step, totalSteps = 4, onSkip }: OnboardingHeaderProps) {
  const navigation = useNavigation();

  return (
    <View className="mb-6 mt-2 flex-row items-center justify-between">
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-brand-ink/5"
      >
        <Ionicons name="arrow-back" size={18} color="#1E1E1E" />
      </Pressable>

      <View className="flex-1 flex-row gap-1.5 px-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i < step ? '#5B1F24' : 'rgba(30,30,30,0.08)' }}
          />
        ))}
      </View>

      {onSkip ? (
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip">
          <Text className="text-[11px] font-sans-semibold uppercase tracking-[0.15em] text-brand-ink/40">Skip</Text>
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}
