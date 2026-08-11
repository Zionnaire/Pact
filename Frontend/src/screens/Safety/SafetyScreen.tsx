import React from 'react';
import { View, Text, Linking, Pressable, Alert } from 'react-native';
import { Screen, TopBar, Button } from '../../components';
import { usePact } from '../../contexts/PactContext';

const RESOURCES = [
  { label: '988 Suicide & Crisis Lifeline (US)', action: () => Linking.openURL('tel:988') },
  { label: 'National Domestic Violence Hotline (US)', action: () => Linking.openURL('tel:18007997233') },
];

export function SafetyScreen() {
  const { snapshot, pause, resume } = usePact();
  const isPaused = snapshot?.pact.status === 'paused';

  const handleTogglePause = () => {
    Alert.alert(
      isPaused ? 'Resume this pact?' : 'Pause this pact?',
      isPaused ? undefined : 'No new entries or reveals can happen until either of you resumes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: isPaused ? 'Resume' : 'Pause', onPress: () => (isPaused ? resume() : pause()) },
      ],
    );
  };

  return (
    <Screen>
      <TopBar title="Safety" showBack />

      <View className="mb-6 rounded-3xl bg-brand-plum-deep p-6">
        <Text className="font-serif text-xl text-brand-paper">
          {isPaused ? 'This pact is paused' : 'Pause anytime, no explanation needed'}
        </Text>
        <Text className="mt-2 text-[13px] leading-5 text-brand-paper/70">
          Either partner can pause unilaterally. It blocks new entries and reveals until either of you resumes —
          the other person is notified, but not why.
        </Text>
        <View className="mt-4">
          <Button label={isPaused ? 'Resume pact' : 'Pause pact'} variant="secondary" onPress={handleTogglePause} />
        </View>
      </View>

      <Text className="mb-3 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">
        If you need support right now
      </Text>
      <Text className="mb-4 text-[13px] leading-5 text-brand-ink/50">
        Pact is not a substitute for professional support. If you're outside the US, search for your local
        crisis line or emergency services.
      </Text>
      {RESOURCES.map((resource) => (
        <Pressable
          key={resource.label}
          onPress={resource.action}
          className="min-h-11 flex-row items-center justify-between border-b border-brand-ink/5 py-4"
        >
          <Text className="text-[14px] text-brand-plum">{resource.label}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}
