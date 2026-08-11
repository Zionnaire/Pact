import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';

interface VoiceRecorderProps {
  onRecorded: (uri: string, durationSec: number) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Record FAB — tap to start/stop rather than hold-to-record, which is
 * unreliable across platforms with Pressable's release events. See
 * Pact_Design_System.md §4.
 */
export function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 200);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then((result) => {
      setPermissionDenied(!result.granted);
    });
  }, []);

  const startRecording = async () => {
    if (permissionDenied) {
      Alert.alert('Microphone access needed', 'Enable microphone access in Settings to record a voice note.');
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };

  const stopRecording = async () => {
    const durationMs = state.durationMillis ?? 0;
    await recorder.stop();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (recorder.uri) {
      onRecorded(recorder.uri, Math.round(durationMs / 1000));
    }
  };

  return (
    <View className="items-center py-8">
      <Pressable
        onPress={state.isRecording ? stopRecording : startRecording}
        accessibilityRole="button"
        accessibilityLabel={state.isRecording ? 'Stop recording' : 'Start recording'}
        className="h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: state.isRecording ? '#E5989B' : '#5B1F24' }}
      >
        <Ionicons name={state.isRecording ? 'square' : 'mic'} size={28} color="#F9F7F2" />
      </Pressable>
      <Text className="mt-4 text-sm text-brand-ink/60">
        {state.isRecording ? formatDuration(state.durationMillis ?? 0) : 'Tap to record'}
      </Text>
    </View>
  );
}
