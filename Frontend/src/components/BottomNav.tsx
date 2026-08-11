import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useResponsive, MAX_CONTENT_WIDTH } from '../utils/responsive';

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Vault: 'lock-closed',
  Pulse: 'pulse',
  Pact: 'people',
};

function TabButton({
  label,
  icon,
  isFocused,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, { damping: 10, stiffness: 220 });
    dotOpacity.value = withSpring(isFocused ? 1 : 0, { damping: 14 });
  }, [isFocused, scale, dotOpacity]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-11 min-w-11 flex-1 items-center justify-center gap-1 py-1"
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={icon} size={22} color={isFocused ? '#5B1F24' : 'rgba(30,30,30,0.4)'} />
      </Animated.View>
      <Text
        className="text-[10px]"
        style={{
          color: isFocused ? '#5B1F24' : 'rgba(30,30,30,0.4)',
          fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_400Regular',
        }}
      >
        {label}
      </Text>
      <Animated.View style={dotStyle} className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-brand-gold" />
    </Pressable>
  );
}

/** 4 tabs + raised plum FAB for /drop — Pact_Design_System.md §4. */
export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();

  const goToDrop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    // Drop is a modal registered on the parent stack, not a tab route.
    navigation.getParent()?.navigate('Drop' as never);
  };

  const midpoint = Math.ceil(state.routes.length / 2);
  const leftRoutes = state.routes.slice(0, midpoint);
  const rightRoutes = state.routes.slice(midpoint);

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const isFocused = state.index === index;
    const rawLabel = descriptors[route.key]?.options.tabBarLabel;
    const label = typeof rawLabel === 'string' ? rawLabel : route.name;

    return (
      <TabButton
        key={route.key}
        label={String(label)}
        icon={TAB_ICON[route.name] ?? 'ellipse'}
        isFocused={isFocused}
        onPress={() => navigation.navigate(route.name)}
      />
    );
  };

  return (
    <View
      className="border-t border-brand-ink/5 bg-white px-2 pt-2"
      style={{ paddingBottom: insets.bottom + 8 }}
      aria-label="Primary"
    >
      <View
        className="flex-row items-center self-center"
        style={isTablet ? { width: '100%', maxWidth: MAX_CONTENT_WIDTH } : { width: '100%' }}
      >
        {leftRoutes.map((route, i) => renderTab(route, i))}

        <Pressable
          onPress={goToDrop}
          accessibilityRole="button"
          accessibilityLabel="Drop an entry"
          className="-mt-8 h-16 w-16 items-center justify-center rounded-full bg-brand-plum active:scale-95"
          style={{
            shadowColor: '#5B1F24',
            shadowOpacity: 0.4,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="#F9F7F2" />
        </Pressable>

        {rightRoutes.map((route, i) => renderTab(route, midpoint + i))}
      </View>
    </View>
  );
}
