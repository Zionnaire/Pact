import React, { useEffect } from 'react';
import { View, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/tokens';

interface PulsingHeartProps {
  size?: number;
}

/**
 * A slow, gentle heartbeat rather than a literal fast lub-dub — matches the
 * "unhurried, intentional" brand direction (Pact_Design_System.md §5:
 * nothing bounces). Respects reduced-motion by simply not animating.
 */
export function PulsingHeart({ size = 72 }: PulsingHeartProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!mounted || reduced) return;
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 650, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 650, easing: Easing.in(Easing.quad) }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
      );
    });
    return () => {
      mounted = false;
    };
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowSize = size * 2.2;

  return (
    <View className="items-center justify-center" style={{ width: glowSize, height: glowSize }}>
      <View
        className="absolute rounded-full bg-brand-gold/10"
        style={{ width: glowSize, height: glowSize }}
      />
      <View
        className="absolute rounded-full bg-brand-gold/10"
        style={{ width: glowSize * 0.7, height: glowSize * 0.7 }}
      />
      <Animated.View style={animatedStyle}>
        <Ionicons name="heart" size={size} color={colors.brandPlum} />
      </Animated.View>
    </View>
  );
}
