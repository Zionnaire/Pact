import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-brand-paper">
      <Text className="font-serif text-4xl text-brand-plum">Pact</Text>
      <Text className="mt-2 text-xs uppercase tracking-[0.3em] text-brand-clay">Say what you mean</Text>
      <ActivityIndicator className="mt-8" color="#5B1F24" />
    </View>
  );
}
