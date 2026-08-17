import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import { PairingChoiceScreen } from '../screens/onboarding/PairingChoiceScreen';
import { JoinPactScreen } from '../screens/onboarding/JoinPactScreen';
import { IntentionScreen } from '../screens/onboarding/IntentionScreen';
import { InviteScreen } from '../screens/onboarding/InviteScreen';
import { CycleScreen } from '../screens/onboarding/CycleScreen';
import { FirstDropScreen } from '../screens/onboarding/FirstDropScreen';
import { PairedScreen } from '../screens/onboarding/PairedScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PairingChoice" component={PairingChoiceScreen} />
      <Stack.Screen name="JoinPact" component={JoinPactScreen} />
      <Stack.Screen name="Intention" component={IntentionScreen} />
      <Stack.Screen name="Invite" component={InviteScreen} />
      <Stack.Screen name="Cycle" component={CycleScreen} />
      <Stack.Screen name="FirstDrop" component={FirstDropScreen} />
      <Stack.Screen name="Paired" component={PairedScreen} />
    </Stack.Navigator>
  );
}
