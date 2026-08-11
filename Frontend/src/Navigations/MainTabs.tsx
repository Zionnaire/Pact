import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { BottomNav } from '../components/BottomNav';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { VaultScreen } from '../screens/Vault/VaultScreen';
import { PulseScreen } from '../screens/Pulse/PulseScreen';
import { PactScreen } from '../screens/Pact/PactScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
      <Tab.Screen name="Pulse" component={PulseScreen} />
      <Tab.Screen name="Pact" component={PactScreen} />
    </Tab.Navigator>
  );
}
