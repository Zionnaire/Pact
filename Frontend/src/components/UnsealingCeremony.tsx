import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { AmbientBackground } from './AmbientBackground';

/**
 * Plays once, between "both consented" and the entries actually rendering —
 * the ceremonial beat the design doc calls for instead of a flat swap.
 * See Pact_Design_System.md §5.
 */
export function UnsealingCeremony() {
  const glow = useSharedValue(0.6);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(0.9, { duration: 900, easing: Easing.in(Easing.quad) }),
      ),
      -1,
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
  }));

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-brand-plum-deep">
      <AmbientBackground variant="ceremony" />
      <Animated.View entering={FadeIn.duration(400)} className="items-center">
        <View className="items-center justify-center" style={{ width: 140, height: 140 }}>
          <Animated.View
            style={[glowStyle, { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#D4AF3740' }]}
          />
          <Ionicons name="lock-open" size={40} color="#D4AF37" />
        </View>
        <Text className="mt-8 font-serif text-2xl text-brand-paper">Unsealing your cycle</Text>
        <Text className="mt-2 text-[13px] text-brand-paper/60">Just a moment…</Text>
      </Animated.View>
    </SafeAreaView>
  );
}
