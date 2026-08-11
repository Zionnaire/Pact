import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
  /** Use on dark backgrounds (e.g. the Reveal ceremony) — swaps ink for paper. */
  dark?: boolean;
}

export function TopBar({ title, showBack = false, right, dark = false }: TopBarProps) {
  const navigation = useNavigation();
  const iconColor = dark ? '#F9F7F2' : '#1E1E1E';

  return (
    <View
      className="mb-6 flex-row items-center justify-between py-2"
      accessibilityRole="header"
      aria-label="Primary"
    >
      <View className="w-10">
        {showBack && (
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="min-h-11 min-w-11 items-start justify-center"
          >
            <Ionicons name="chevron-back" size={24} color={iconColor} />
          </Pressable>
        )}
      </View>
      <Text className={`font-serif text-lg ${dark ? 'text-brand-paper' : 'text-brand-ink'}`}>{title}</Text>
      <View className="w-10 items-end">{right}</View>
    </View>
  );
}
