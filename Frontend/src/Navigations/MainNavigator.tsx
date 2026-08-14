import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { DropScreen } from '../screens/Drop/DropScreen';
import { RevealScreen } from '../screens/Reveal/RevealScreen';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';
import { TalkScreen } from '../screens/Talk/TalkScreen';
import { TherapistScreen } from '../screens/Therapist/TherapistScreen';
import { SafetyScreen } from '../screens/Safety/SafetyScreen';
import { BondedScreen } from '../screens/Bonded/BondedScreen';
import { CycleSettingsScreen } from '../screens/CycleSettings/CycleSettingsScreen';
import { EditProfileScreen } from '../screens/EditProfile/EditProfileScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccount/DeleteAccountScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Drop" component={DropScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Reveal" component={RevealScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Talk" component={TalkScreen} />
      <Stack.Screen name="Therapist" component={TherapistScreen} />
      <Stack.Screen name="Safety" component={SafetyScreen} />
      <Stack.Screen name="Bonded" component={BondedScreen} />
      <Stack.Screen name="CycleSettings" component={CycleSettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Stack.Navigator>
  );
}
