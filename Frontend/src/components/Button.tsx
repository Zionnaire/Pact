import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-plum',
  secondary: 'bg-brand-paper border border-brand-ink/10',
  ghost: 'bg-transparent',
  danger: 'bg-type-rant',
};

const VARIANT_TEXT_COLOR: Record<Variant, string> = {
  primary: '#F9F7F2',
  secondary: '#1E1E1E',
  ghost: '#5B1F24',
  danger: '#ffffff',
};

// Only the filled variants read as "raised" — ghost/secondary stay flat.
const VARIANT_SHADOW: Record<Variant, object> = {
  primary: {
    shadowColor: '#5B1F24',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  secondary: {},
  ghost: {},
  danger: {
    shadowColor: '#E5989B',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Primary tap target — spring-scale press + haptic, see Pact_Design_System.md §5. */
export function Button({ label, onPress, variant = 'primary', disabled, loading, fullWidth = true, icon }: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        if (!isDisabled) scale.value = withSpring(0.96, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[!isDisabled && VARIANT_SHADOW[variant], { opacity: isDisabled ? 0.4 : 1 }, animatedStyle]}
      className={[
        'min-h-11 items-center justify-center rounded-full px-6 py-3',
        VARIANT_CLASSES[variant],
        fullWidth ? 'w-full' : '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#F9F7F2' : '#5B1F24'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <Ionicons name={icon} size={15} color={VARIANT_TEXT_COLOR[variant]} />}
          <Text className="text-center text-[15px] font-sans-semibold" style={{ color: VARIANT_TEXT_COLOR[variant] }}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
