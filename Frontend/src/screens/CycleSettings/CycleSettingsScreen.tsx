import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { usePact } from '../../contexts/PactContext';
import { pactService } from '../../services/pact.service';
import { ApiRequestError } from '../../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LENGTH_OPTIONS = [
  { days: 3, label: '3 days' },
  { days: 7, label: 'Weekly' },
  { days: 14, label: 'Biweekly' },
  { days: 30, label: 'Monthly' },
];

export function CycleSettingsScreen() {
  const { snapshot, refresh } = usePact();
  const pact = snapshot?.pact;

  const [cycleLengthDays, setCycleLengthDays] = useState(pact?.cycleLengthDays ?? 7);
  const [revealDay, setRevealDay] = useState(pact?.revealDay ?? 0);
  const [revealTime, setRevealTime] = useState(pact?.revealTime ?? '20:00');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!/^\d{2}:\d{2}$/.test(revealTime)) {
      setError('Reveal time must be in HH:mm format, e.g. 20:00');
      return;
    }
    setError(null);
    setSaved(false);
    setIsSubmitting(true);
    try {
      await pactService.update({ cycleLengthDays, revealDay, revealTime });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save your changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Cycle settings" showBack />
      <Text className="mb-6 text-[13px] text-brand-ink/50">
        Changes apply from your next cycle onward — an already-open cycle's reveal time only moves if it hasn't started counting down yet.
      </Text>

      <Text className="mb-2 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Cycle length</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {LENGTH_OPTIONS.map((option) => {
          const selected = cycleLengthDays === option.days;
          return (
            <Pressable
              key={option.days}
              onPress={() => setCycleLengthDays(option.days)}
              className="min-h-11 rounded-full px-4 py-2"
              style={{ backgroundColor: selected ? '#5B1F24' : '#ffffff', borderWidth: selected ? 0 : 1, borderColor: 'rgba(30,30,30,0.1)' }}
            >
              <Text style={{ color: selected ? '#F9F7F2' : '#1E1E1E' }} className="text-[13px]">{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-2 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Reveal day</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {DAYS.map((day, index) => {
          const selected = revealDay === index;
          return (
            <Pressable
              key={day}
              onPress={() => setRevealDay(index)}
              className="min-h-11 rounded-xl px-3 py-2"
              style={{ backgroundColor: selected ? '#5B1F24' : '#ffffff', borderWidth: selected ? 0 : 1, borderColor: 'rgba(30,30,30,0.1)' }}
            >
              <Text style={{ color: selected ? '#F9F7F2' : '#1E1E1E' }} className="text-[12px]">{day.slice(0, 3)}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField label="Reveal time (24h)" value={revealTime} onChangeText={setRevealTime} placeholder="20:00" />

      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      {saved && !error && <Text className="mb-4 text-[13px] text-type-note">Saved.</Text>}
      <Button label="Save changes" onPress={handleSave} loading={isSubmitting} />
    </Screen>
  );
}
