import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Screen, Button, Avatar, AmbientBackground } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

export function PairedScreen() {
  const { user, refreshUser } = useAuth();
  const [isEntering, setIsEntering] = useState(false);

  const handleEnter = async () => {
    setIsEntering(true);
    // Syncs AuthContext.user.pactId, which is what RootNavigator switches on.
    await refreshUser();
  };

  return (
    <Screen scroll={false} className="items-center justify-center bg-brand-plum-deep" ambient>
      <AmbientBackground variant="ceremony" />

      <Animated.View entering={ZoomIn.duration(600).springify().damping(12)} className="items-center">
        <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-gold">Paired</Text>
        <View className="mt-4 flex-row items-center gap-3">
          {user && <Avatar avatarUrl={user.avatarUrl} avatarInitial={user.avatarInitial} size={52} />}
          <LinearGradient colors={['#D4AF37', '#D4AF37']} style={{ width: 24, height: 1 }} />
          <View className="h-2 w-2 rounded-full bg-brand-gold" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(600)} className="mt-8 items-center px-4">
        <Text className="text-center font-serif text-3xl italic text-brand-paper">You're building this together.</Text>
        <Text className="mt-3 text-center text-[13px] leading-5 text-brand-paper/60">
          Your first cycle is open. Drop when something stays with you — the rest is timing.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(600)} className="mt-12 w-full">
        <Button label="Enter your home" onPress={handleEnter} loading={isEntering} />
      </Animated.View>
    </Screen>
  );
}
