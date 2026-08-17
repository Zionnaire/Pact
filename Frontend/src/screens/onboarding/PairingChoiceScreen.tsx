import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Screen, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import type { OnboardingStackParamList } from '../../Navigations/types';

/**
 * The first thing an authenticated-but-unpaired person sees — registration
 * itself never creates a pact anymore (see auth.controller.ts register /
 * RegisterScreen). This is where identity and relationship actually branch:
 * start a new pact, or join one someone already started for you.
 */
export function PairingChoiceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { user } = useAuth();

  return (
    <Screen scroll={false} className="justify-between py-12">
      <View>
        <Animated.View entering={FadeInDown.duration(600).springify().damping(16)} className="mt-10">
          <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">
            Welcome, {user?.displayName?.split(' ')[0] ?? 'there'}
          </Text>
          <Text className="mt-4 font-serif text-[28px] leading-tight text-brand-plum">
            Are you starting a pact, or joining one?
          </Text>
          <Text className="mt-3 text-[13px] leading-5 text-brand-ink/50">
            A pact is between two people. If someone already invited you, join theirs — otherwise, start your own and invite them.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(200).duration(600).springify().damping(18)} className="gap-3">
        <Button label="Start a new pact" onPress={() => navigation.navigate('Intention')} />
        <Button label="I have an invite code" variant="secondary" onPress={() => navigation.navigate('JoinPact')} />
      </Animated.View>
    </Screen>
  );
}
