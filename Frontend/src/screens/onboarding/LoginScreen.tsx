import React, { useState } from 'react';
import { Text } from 'react-native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../types';

export function LoginScreen() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not log in — check your details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Log in" showBack />
      <TextField
        label="Email or phone"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Log in" onPress={handleSubmit} loading={isSubmitting} disabled={!identifier || !password} />
    </Screen>
  );
}
