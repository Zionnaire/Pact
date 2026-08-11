import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, OnboardingHeader, TextField, Button } from '../../components';
import { pactService } from '../../services/pact.service';
import type { OnboardingStackParamList } from '../../Navigations/types';
import { ApiRequestError } from '../../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LENGTH_OPTIONS = [
  { days: 3, label: '3 days', description: 'For quick resets' },
  { days: 7, label: 'Weekly', description: 'Most couples start here' },
  { days: 14, label: 'Biweekly', description: 'Room to breathe' },
  { days: 30, label: 'Monthly', description: 'Long-form reflection' },
];

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function CycleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();

  const [cycleLengthDays, setCycleLengthDays] = useState(7);
  const [revealDay, setRevealDay] = useState(0);
  const [revealTime, setRevealTime] = useState('21:00');
  const [cycleName, setCycleName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!/^\d{2}:\d{2}$/.test(revealTime)) {
      setError('Reveal time must be in HH:mm format, e.g. 21:00');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await pactService.update({
        cycleLengthDays,
        revealDay,
        revealTime,
        timezone: detectTimezone(),
        cycleName: cycleName.trim() || undefined,
      });
      navigation.navigate('FirstDrop');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save your cycle settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <OnboardingHeader step={3} />

      <Animated.View entering={FadeInDown.duration(500)}>
        <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Step 3 of 4 · Together</Text>
        <Text className="mt-3 font-serif text-3xl leading-tight text-brand-plum">Set your first cycle.</Text>
      </Animated.View>

      <Text className="mb-2 mt-6 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Cycle length</Text>
      <View className="gap-2">
        {LENGTH_OPTIONS.map((option) => {
          const selected = cycleLengthDays === option.days;
          return (
            <Pressable
              key={option.days}
              onPress={() => setCycleLengthDays(option.days)}
              className="min-h-11 flex-row items-center justify-between rounded-2xl px-4 py-3"
              style={{ backgroundColor: selected ? '#5B1F24' : '#ffffff', borderWidth: selected ? 0 : 1, borderColor: 'rgba(30,30,30,0.08)' }}
            >
              <View>
                <Text style={{ color: selected ? '#F9F7F2' : '#1E1E1E' }} className="text-[15px]">{option.label}</Text>
                <Text style={{ color: selected ? 'rgba(249,247,242,0.7)' : 'rgba(30,30,30,0.5)' }} className="text-[12px]">
                  {option.description}
                </Text>
              </View>
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: selected ? '#D4AF37' : 'transparent', borderWidth: selected ? 0 : 1, borderColor: 'rgba(30,30,30,0.2)' }}
              />
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6 flex-row gap-3">
        <Pressable
          onPress={() => setRevealDay((d) => (d + 1) % 7)}
          className="min-h-11 flex-1 justify-center rounded-2xl bg-white p-3 ring-1 ring-brand-ink/10"
        >
          <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.2em] text-brand-clay">Reveal day</Text>
          <Text className="mt-1 text-[15px] text-brand-ink">{DAYS[revealDay]}</Text>
        </Pressable>
        <View className="flex-1">
          <TextField label="Time" value={revealTime} onChangeText={setRevealTime} placeholder="21:00" />
        </View>
      </View>

      <TextField label="Name this cycle (optional)" value={cycleName} onChangeText={setCycleName} placeholder="Our June Reset" />

      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Set cycle" onPress={handleSubmit} loading={isSubmitting} />
    </Screen>
  );
}
