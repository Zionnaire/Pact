import React, { useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/lib/typescript/components/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, interpolate, type SharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SwipeToDeleteProps {
  onDelete: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// A proper component (not an inline closure) so its useAnimatedStyle call
// obeys the rules of hooks — Swipeable invokes renderRightActions during its
// own render, which isn't a safe place to call hooks directly.
function DeleteAction({ progress, onPress }: { progress: SharedValue<number>; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 1]) }],
  }));

  return (
    <Animated.View style={[style, { justifyContent: 'center', paddingLeft: 12 }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Delete entry"
        className="h-full w-20 items-center justify-center rounded-2xl"
        style={{ backgroundColor: '#E5989B' }}
      >
        <Ionicons name="trash-outline" size={20} color="#ffffff" />
        <Text className="mt-1 text-[11px] text-white">Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Swipe-left-to-reveal delete, used on Vault entries while their cycle is open. */
export function SwipeToDelete({ onDelete, disabled = false, children }: SwipeToDeleteProps) {
  const ref = useRef<SwipeableMethods>(null);

  if (disabled) {
    return <View>{children}</View>;
  }

  return (
    <Swipeable
      ref={ref}
      renderRightActions={(progress) => (
        <DeleteAction
          progress={progress}
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
        />
      )}
      rightThreshold={40}
      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}
