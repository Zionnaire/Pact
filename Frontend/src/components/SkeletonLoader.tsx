import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { AccessibilityInfo } from 'react-native';

interface SkeletonLoaderProps {
  height?: number;
  className?: string;
}

/** Shimmer block matching a card's shape — see Pact_Design_System.md §4. */
export function SkeletonLoader({ height = 80, className }: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!mounted || reduced) return;
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    });
    return () => {
      mounted = false;
    };
  }, [opacity]);

  return (
    <Animated.View style={{ height, opacity }}>
      <View className={`h-full w-full rounded-2xl bg-brand-ink/5 ${className ?? ''}`} />
    </Animated.View>
  );
}
