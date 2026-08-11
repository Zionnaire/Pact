import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { PactProvider } from '../contexts/PactContext';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { MainNavigator } from './MainNavigator';
import { SplashScreen } from '../screens/SplashScreen';

/**
 * Three-way switch, per Pact_System_Design.md invariant that a user is
 * either unauthenticated, authenticated-but-unpaired, or fully in a pact:
 *   not authenticated  → AuthStack (Welcome/Login/Register)
 *   authenticated, no pact → OnboardingStack (pairing flow)
 *   authenticated + paired → MainNavigator (the app)
 */
export function RootNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !user?.pactId ? (
        <OnboardingStack />
      ) : (
        <PactProvider>
          <MainNavigator />
        </PactProvider>
      )}
    </NavigationContainer>
  );
}
