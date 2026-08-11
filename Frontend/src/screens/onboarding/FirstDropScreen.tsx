import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, OnboardingHeader, TypeSelector, Button } from '../../components';
import { entryService } from '../../services/entry.service';
import { aiService } from '../../services/ai.service';
import type { OnboardingStackParamList } from '../../Navigations/types';
import type { EntryType } from '../../types';
import { ApiRequestError } from '../../types';

const MAX_LENGTH = 600;

export function FirstDropScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();

  const [type, setType] = useState<EntryType | null>('appreciation');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingTone, setIsCheckingTone] = useState(false);

  const handleToneCheck = async () => {
    if (!body.trim()) return;
    setIsCheckingTone(true);
    try {
      const suggestion = await aiService.toneCheck(body.trim(), type ?? undefined);
      setBody(suggestion.slice(0, MAX_LENGTH));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Tone check is unavailable right now');
    } finally {
      setIsCheckingTone(false);
    }
  };

  const handleSeal = async () => {
    if (!type || !body.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await entryService.create({ type, body: body.trim(), intensity: 3 });
      navigation.navigate('Paired');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not seal your entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <OnboardingHeader step={4} onSkip={() => navigation.navigate('Paired')} />

      <Animated.View entering={FadeInDown.duration(500)}>
        <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Step 4 of 4</Text>
        <Text className="mt-3 font-serif text-3xl leading-tight text-brand-plum">Something stayed with you.</Text>
        <Text className="mt-3 text-[13px] text-brand-ink/50">
          Start small. What's one thing from this week you'd like to name?
        </Text>
      </Animated.View>

      <View className="mt-6">
        <TypeSelector value={type} onChange={setType} />
      </View>

      <View className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-brand-ink/10">
        <TextInput
          value={body}
          onChangeText={(text) => setBody(text.slice(0, MAX_LENGTH))}
          placeholder="Say it honestly. No one sees this until reveal…"
          placeholderTextColor="rgba(30,30,30,0.3)"
          multiline
          numberOfLines={5}
          style={{ minHeight: 110, textAlignVertical: 'top' }}
          className="text-[15px] text-brand-ink"
        />
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable
            onPress={handleToneCheck}
            disabled={!body.trim() || isCheckingTone}
            accessibilityRole="button"
            accessibilityLabel="Tone check"
            className="min-h-11 flex-row items-center gap-1"
          >
            {isCheckingTone ? (
              <ActivityIndicator size="small" color="#C36341" />
            ) : (
              <Ionicons name="sparkles-outline" size={14} color="#C36341" />
            )}
            <Text className="text-[11px] font-sans-semibold uppercase tracking-[0.15em] text-brand-clay">Tone check</Text>
          </Pressable>
          <Text className="text-[11px] text-brand-ink/30">{body.length}/{MAX_LENGTH}</Text>
        </View>
      </View>

      {error && <Text className="mb-4 mt-4 text-[13px] text-type-rant">{error}</Text>}

      <View className="mt-6">
        <Button label="Seal my first drop" onPress={handleSeal} loading={isSubmitting} disabled={!type || !body.trim()} />
        <Pressable onPress={() => navigation.navigate('Paired')} className="mt-3 min-h-11 items-center justify-center">
          <Text className="text-[11px] font-sans-semibold uppercase tracking-[0.15em] text-brand-clay">I'll drop later</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
