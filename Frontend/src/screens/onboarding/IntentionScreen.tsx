import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, OnboardingHeader, Button } from '../../components';
import { pactService } from '../../services/pact.service';
import type { OnboardingStackParamList } from '../../Navigations/types';
import { ApiRequestError } from '../../types';

const FEELINGS = ['Heard', 'Safe', 'Exciting', 'Respected', 'Seen', 'Peaceful', 'Connected', 'Growing'];

export function IntentionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = (feeling: string) => {
    setSelected((current) => (current.includes(feeling) ? current.filter((f) => f !== feeling) : [...current, feeling]));
  };

  const proceed = async (intentions?: string[]) => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Sensible defaults now; the Cycle step lets them fine-tune cadence
      // once the pact (and therefore an invite) exists.
      await pactService.create({ intentions });
      navigation.navigate('Invite');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not start your pact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scroll={false} className="justify-between pb-4">
      <View>
        <OnboardingHeader step={1} onSkip={() => proceed()} />

        <Animated.View entering={FadeInDown.duration(500)}>
          <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Step 1 of 4</Text>
          <Text className="mt-3 font-serif text-3xl leading-tight text-brand-plum">
            What do you want your relationship to feel like?
          </Text>
          <Text className="mt-3 text-[13px] text-brand-ink/50">Pick as many as feel true.</Text>

          <View className="mt-6 flex-row flex-wrap gap-2">
            {FEELINGS.map((feeling) => {
              const isSelected = selected.includes(feeling);
              return (
                <Pressable
                  key={feeling}
                  onPress={() => toggle(feeling)}
                  accessibilityRole="button"
                  accessibilityLabel={feeling}
                  className="min-h-11 rounded-full px-4 py-2"
                  style={{
                    backgroundColor: isSelected ? '#5B1F24' : '#ffffff',
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: 'rgba(30,30,30,0.1)',
                  }}
                >
                  <Text style={{ color: isSelected ? '#F9F7F2' : '#1E1E1E' }} className="text-[13px]">
                    {feeling}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {error && <Text className="mt-6 text-[13px] text-type-rant">{error}</Text>}
      </View>

      <Button
        label={`Continue${selected.length ? ` (${selected.length})` : ''}`}
        onPress={() => proceed(selected.length ? selected : undefined)}
        loading={isSubmitting}
      />
    </Screen>
  );
}
