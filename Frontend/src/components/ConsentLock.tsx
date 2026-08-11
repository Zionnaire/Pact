import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Avatar } from './Avatar';
import type { User } from '../types';

function ConsentAvatar({
  avatarUrl,
  avatarInitial,
  consented,
}: {
  avatarUrl?: string;
  avatarInitial: string;
  consented: boolean;
}) {
  const opacity = useSharedValue(consented ? 1 : 0.4);
  const scale = useSharedValue(consented ? 1 : 0.94);

  useEffect(() => {
    opacity.value = withTiming(consented ? 1 : 0.4, { duration: 400 });
    scale.value = withSpring(consented ? 1 : 0.94, { damping: 12 });
  }, [consented, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Avatar avatarUrl={avatarUrl} avatarInitial={avatarInitial} size={56} />
    </Animated.View>
  );
}

interface ConsentLockProps {
  self: User;
  partner: User | null;
  selfConsented: boolean;
  partnerConsented: boolean;
}

/** Dual avatar state, unlocks only when both are lit — Pact_Design_System.md §4. */
export function ConsentLock({ self, partner, selfConsented, partnerConsented }: ConsentLockProps) {
  const bothReady = selfConsented && partnerConsented;
  const glow = useSharedValue(1);

  useEffect(() => {
    if (!bothReady) {
      glow.value = 1;
      return;
    }
    glow.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
  }, [bothReady, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
    opacity: bothReady ? 0.35 : 0,
  }));

  return (
    <Animated.View entering={FadeIn.duration(500)} className="overflow-hidden rounded-3xl">
      <LinearGradient colors={['#3A1218', '#22131A']} style={{ padding: 32, alignItems: 'center' }}>
        <View className="flex-row items-center gap-6">
          <ConsentAvatar avatarUrl={self.avatarUrl} avatarInitial={self.avatarInitial} consented={selfConsented} />

          <View className="items-center justify-center" style={{ width: 40, height: 40 }}>
            <Animated.View
              style={[glowStyle, { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#D4AF37' }]}
            />
            <Ionicons name={bothReady ? 'lock-open' : 'lock-closed'} size={22} color="#D4AF37" />
          </View>

          {partner ? (
            <ConsentAvatar avatarUrl={partner.avatarUrl} avatarInitial={partner.avatarInitial} consented={partnerConsented} />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-paper/10">
              <Text className="text-brand-paper/40">?</Text>
            </View>
          )}
        </View>
        <Text className="mt-6 text-center text-sm text-brand-paper/70">
          {bothReady ? 'Both of you are ready. Unlock the vault together.' : 'Waiting for both of you to consent.'}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}
