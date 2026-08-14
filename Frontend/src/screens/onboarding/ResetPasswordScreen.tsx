import React, { useState } from 'react';
import { Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, TopBar, TextField, Button } from '../../components';
import { authService } from '../../services/auth.service';
import { ApiRequestError } from '../../types';
import type { AuthStackParamList } from '../../Navigations/types';

export function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const { identifier } = route.params;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.resetPassword(identifier, code.trim(), newPassword);
      navigation.navigate('Login');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not reset your password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Enter your code" showBack />
      <Text className="mb-6 text-[13px] leading-5 text-brand-ink/60">
        If an account exists for {identifier}, a 6-digit code is on its way. It expires in 15 minutes.
      </Text>
      <TextField
        label="6-digit code"
        value={code}
        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        placeholder="000000"
        maxLength={6}
      />
      <TextField
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="At least 8 characters"
      />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button
        label="Reset password"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={code.length !== 6 || newPassword.length < 8}
      />
    </Screen>
  );
}
