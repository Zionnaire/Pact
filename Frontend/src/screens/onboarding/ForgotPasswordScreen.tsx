import React, { useState } from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, TopBar, TextField, Button } from '../../components';
import { authService } from '../../services/auth.service';
import { ApiRequestError } from '../../types';
import type { AuthStackParamList } from '../../Navigations/types';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(identifier.trim());
      navigation.navigate('ResetPassword', { identifier: identifier.trim() });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong — try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Reset password" showBack />
      <Text className="mb-6 text-[13px] leading-5 text-brand-ink/60">
        Enter the email on your account and we'll send you a 6-digit code to reset your password.
      </Text>
      <TextField
        label="Email"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Send reset code" onPress={handleSubmit} loading={isSubmitting} disabled={!identifier.trim()} />
    </Screen>
  );
}
