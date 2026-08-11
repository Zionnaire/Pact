import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PairAvatars } from './PairAvatars';
import { useAuth } from '../contexts/AuthContext';
import { usePartner } from '../hooks/usePartner';
import type { MainStackParamList } from '../Navigations/types';

interface AppHeaderProps {
  title: string;
}

/** Avatars-left / italic wordmark-center / menu-right — used on every main tab screen. */
export function AppHeader({ title }: AppHeaderProps) {
  const { user } = useAuth();
  const partner = usePartner();
  const navigation = useNavigation();
  const parentNav = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <View className="mb-4 mt-2 flex-row items-center justify-between">
      {user ? <PairAvatars self={user} partner={partner} /> : <View style={{ width: 32, height: 32 }} />}
      <Text className="font-serif text-xl italic text-brand-plum">{title}</Text>
      <Pressable
        onPress={() => parentNav?.navigate('Notifications')}
        accessibilityRole="button"
        accessibilityLabel="Menu"
        className="h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-brand-ink/5 active:opacity-70"
      >
        <Ionicons name="menu" size={18} color="#1E1E1E" />
      </Pressable>
    </View>
  );
}
