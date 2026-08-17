import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { pactService } from '../../services/pact.service';
import { ApiRequestError } from '../../types';
import type { AuthStackParamList } from '../../Navigations/types';

export function LoginScreen() {
  const { login, refreshUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'Login'>>();
  const inviteCode = route.params?.inviteCode;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);

      if (inviteCode) {
        try {
          await pactService.acceptInvite(inviteCode);
          await refreshUser();
        } catch (inviteErr) {
          setError(
            inviteErr instanceof ApiRequestError
              ? `Logged in, but that invite code didn't work: ${inviteErr.message}`
              : "Logged in, but that invite code didn't work.",
          );
        }
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not log in — check your details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Log in" showBack />
      {inviteCode && (
        <Text className="mb-4 text-[13px] text-brand-clay">
          We'll join you to your pact with code {inviteCode} right after you log in.
        </Text>
      )}
      <TextField
        label="Email or phone"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable onPress={() => navigation.navigate('ForgotPassword')} className="mb-4 min-h-11 items-end justify-center">
        <Text className="text-[12px] font-sans-semibold text-brand-clay">Forgot password?</Text>
      </Pressable>
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Log in" onPress={handleSubmit} loading={isSubmitting} disabled={!identifier || !password} />
    </Screen>
  );
}
