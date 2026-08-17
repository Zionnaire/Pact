import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Screen,
  TypeSelector,
  MoodSelector,
  IntensityMeter,
  DropModeSelector,
  Button,
  VoiceRecorder,
} from '../../components';
import { entryService } from '../../services/entry.service';
import { aiService } from '../../services/ai.service';
import { usePact } from '../../contexts/PactContext';
import { useAuth } from '../../contexts/AuthContext';
import type { DropMode, EntryType } from '../../types';
import { ApiRequestError } from '../../types';
import type { MainStackParamList } from '../../Navigations/types';

type Mode = 'write' | 'record';

const INTENSITY_HINTS: Record<number, string> = {
  1: 'Barely a blip',
  2: 'A little',
  3: 'Matters',
  4: 'Really matters',
  5: 'Everything',
};

const MAX_LENGTH = 600;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DropScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { snapshot, refresh } = usePact();
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>('write');
  const [type, setType] = useState<EntryType | null>(null);
  const [body, setBody] = useState('');
  const [mood, setMood] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [dropMode, setDropMode] = useState<DropMode>('standard');
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingTone, setIsCheckingTone] = useState(false);

  const canSubmit = type && (mode === 'write' ? body.trim().length > 0 : Boolean(recordedUri));
  const revealDayName = snapshot ? DAY_NAMES[snapshot.pact.revealDay] : '';

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
    if (!type || !canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'write') {
        await entryService.create({ type, body: body.trim(), mood: mood.trim() || undefined, intensity, dropMode });
      } else if (recordedUri) {
        await entryService.createVoice({ type, mood: mood.trim() || undefined, intensity, dropMode, audioUri: recordedUri });
      }
      await refresh();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not seal your entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user && !user.profileComplete) {
    return (
      <Screen scroll={false} className="items-center justify-center">
        <Ionicons name="lock-closed-outline" size={32} color="#5B1F24" />
        <Text className="mt-4 text-center font-serif text-xl text-brand-plum">Complete your profile to drop entries</Text>
        <Text className="mt-2 text-center text-[13px] leading-5 text-brand-ink/50">
          You joined with just your name — add an email and password first, so what you write here is never stuck on a single device.
        </Text>
        <View className="mt-6 w-full">
          <Button label="Complete profile" onPress={() => navigation.navigate('CompleteProfile')} />
          <Pressable onPress={() => navigation.goBack()} className="mt-3 min-h-11 items-center justify-center">
            <Text className="text-[13px] text-brand-ink/40">Not now</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="mb-6 mt-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          className="h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-brand-ink/5"
        >
          <Ionicons name="arrow-back" size={18} color="#1E1E1E" />
        </Pressable>
        <Text className="font-serif text-lg italic text-brand-plum">New drop</Text>
        <View style={{ width: 40 }} />
      </View>

      <View className="mb-6 flex-row gap-2">
        <Pressable
          onPress={() => setMode('write')}
          className="min-h-11 flex-1 items-center justify-center rounded-full ring-1 ring-brand-ink/10"
          style={{ backgroundColor: mode === 'write' ? '#5B1F24' : '#ffffff' }}
        >
          <Text style={{ color: mode === 'write' ? '#F9F7F2' : 'rgba(30,30,30,0.6)' }}>Write</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('record')}
          className="min-h-11 flex-1 items-center justify-center rounded-full ring-1 ring-brand-ink/10"
          style={{ backgroundColor: mode === 'record' ? '#5B1F24' : '#ffffff' }}
        >
          <Text style={{ color: mode === 'record' ? '#F9F7F2' : 'rgba(30,30,30,0.6)' }}>Voice</Text>
        </Pressable>
      </View>

      <Text className="mb-1.5 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Type</Text>
      <TypeSelector value={type} onChange={setType} />

      <View className="mt-5">
        <MoodSelector value={mood} onChange={setMood} />
      </View>

      {mode === 'write' ? (
        <View className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-brand-ink/10">
          <TextInput
            value={body}
            onChangeText={(text) => setBody(text.slice(0, MAX_LENGTH))}
            placeholder="What's true for you right now?"
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
      ) : (
        <View className="mt-5">
          <VoiceRecorder onRecorded={(uri) => setRecordedUri(uri)} />
          {recordedUri && (
            <Text className="text-center text-[13px] text-brand-ink/50">Voice note recorded — ready to seal.</Text>
          )}
        </View>
      )}

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Intensity</Text>
        <Text className="font-serif text-[13px] italic text-brand-ink/50">{INTENSITY_HINTS[intensity]}</Text>
      </View>
      <View className="mt-1.5">
        <IntensityMeter value={intensity} onChange={setIntensity} />
      </View>

      <Text className="mb-2 mt-5 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Drop mode</Text>
      <DropModeSelector value={dropMode} onChange={setDropMode} />

      {error && <Text className="mb-4 mt-4 text-[13px] text-type-rant">{error}</Text>}
      {!canSubmit && !error && (
        <Text className="mb-4 mt-4 text-center text-[13px] text-brand-ink/40">
          {!type ? 'Choose a type above to continue.' : mode === 'write' ? 'Write something before sealing.' : 'Record a voice note before sealing.'}
        </Text>
      )}

      <View className="mt-2">
        <Button label="Seal into vault" icon="lock-closed" onPress={handleSeal} loading={isSubmitting} disabled={!canSubmit} />
        <Pressable onPress={() => navigation.goBack()} className="mt-3 min-h-11 items-center justify-center">
          <Text className="text-[13px] text-brand-ink/40">Cancel</Text>
        </Pressable>
        {revealDayName && (
          <Text className="mt-1 text-center text-[10px] uppercase tracking-[0.2em] text-brand-ink/30">
            Sealed until {revealDayName}
          </Text>
        )}
      </View>
    </Screen>
  );
}
