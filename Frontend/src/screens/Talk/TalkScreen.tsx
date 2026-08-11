import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Screen, TopBar, TextField, Button, EmptyState, SkeletonLoader } from '../../components';
import { useTalks } from '../../hooks';
import { talkService } from '../../services/talk.service';
import { ApiRequestError } from '../../types';

export function TalkScreen() {
  const { data: talks, isLoading, refetch } = useTalks();
  const [dateInput, setDateInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      setError('Enter a valid date, e.g. 2026-08-15 19:00');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await talkService.schedule(date.toISOString());
      setDateInput('');
      refetch();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not schedule this talk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Talk together" showBack />

      <TextField
        label="When (YYYY-MM-DD HH:mm)"
        value={dateInput}
        onChangeText={setDateInput}
        placeholder="2026-08-15 19:00"
      />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Schedule a talk" onPress={handleSchedule} loading={isSubmitting} disabled={!dateInput} />

      <View className="mb-3 mt-8 h-px bg-brand-ink/10" />
      <Text className="mb-3 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Upcoming</Text>

      {isLoading && <SkeletonLoader height={60} className="mb-3" />}
      {!isLoading && talks?.length === 0 && (
        <EmptyState icon="calendar-outline" title="No talks scheduled" description="Pick a time to sit down together." />
      )}
      {talks?.map((talk) => (
        <View key={talk._id} className="mb-2 rounded-2xl bg-white p-4 ring-1 ring-brand-ink/5">
          <Text className="text-[14px] text-brand-ink">{new Date(talk.scheduledFor).toLocaleString()}</Text>
          <Text className="mt-1 text-[11px] uppercase tracking-wide text-brand-ink/40">{talk.status}</Text>
        </View>
      ))}
    </Screen>
  );
}
