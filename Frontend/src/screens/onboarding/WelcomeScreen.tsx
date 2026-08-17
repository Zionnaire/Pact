import React from 'react';
import { Text, Pressable, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import { Screen, Button } from '../../components';
import { IMAGES } from '../../theme/images';
import { API_BASE_URL } from '../../config/env';
import type { AuthStackParamList } from '../../Navigations/types';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <Screen scroll={false} className="justify-between py-12" ambient>
      <View>
        <Animated.View entering={FadeInDown.duration(700).springify().damping(16)} className="mt-10">
          <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">
            Welcome to Pact
          </Text>
          <Text className="mt-4 font-serif text-[30px] leading-tight text-brand-plum">
            Say what you mean.{' '}
            <Text className="italic text-brand-clay">Revealed together.</Text>
            {' '}Resolved with intention.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(150).duration(700)}
          className="mt-6 overflow-hidden rounded-3xl"
          style={{ shadowColor: '#3A1218', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}
        >
          <Image source={{ uri: IMAGES.welcomeHero }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(58,18,24,0.6)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }}
          />
          <Text className="absolute bottom-3 left-4 right-4 text-[13px] italic text-brand-paper">
            A sealed vault for the two of you. Drop honestly. Open on your day.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(300).duration(700).springify().damping(18)} className="gap-3">
        <Button label="Start your pact" onPress={() => navigation.navigate('Register')} />
        <Button label="I have an invite code" variant="secondary" onPress={() => navigation.navigate('QuickJoin')} />
        <Pressable onPress={() => navigation.navigate('Login')} className="min-h-11 items-center justify-center">
          <Text className="text-[12px] text-brand-ink/40">Already have an account? Log in</Text>
        </Pressable>
        <Text className="text-center text-[9px] font-sans-semibold uppercase tracking-[0.25em] text-brand-ink/30">
          Encrypted · Consent-based · Private
        </Text>
        <Text className="mt-1 text-center text-[9px] text-brand-ink/20" selectable>
          {API_BASE_URL} · channel: {Updates.channel ?? 'dev'} · rt: {Updates.runtimeVersion ?? '—'}
        </Text>
      </Animated.View>
    </Screen>
  );
}
