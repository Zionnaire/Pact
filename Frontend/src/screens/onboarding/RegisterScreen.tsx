import React, { useState } from 'react';
import { Text } from 'react-native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../types';

/**
 * Registration is deliberately just identity — no pact, no invite code.
 * What comes after (start a new pact vs. join one with a code) is decided
 * on PairingChoiceScreen once you're authenticated. Someone who already
 * has an invite code and no account should use QuickJoinScreen instead —
 * lighter weight, no password required upfront.
 */
export function RegisterScreen() {
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ displayName: displayName.trim(), email: email.trim(), password });
      // RootNavigator switches to OnboardingStack (PairingChoiceScreen) automatically once authenticated.
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not create your account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Create account" showBack />
      <TextField label="Your name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button
        label="Create account"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!displayName || !email || password.length < 8}
      />
      <Text className="mt-3 text-center text-[12px] text-brand-ink/40">Password must be at least 8 characters.</Text>
    </Screen>
  );
}
