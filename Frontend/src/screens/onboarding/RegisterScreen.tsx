import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { pactService } from '../../services/pact.service';
import { ApiRequestError } from '../../types';
import type { AuthStackParamList } from '../../Navigations/types';

export function RegisterScreen() {
  const { register, refreshUser } = useAuth();
  const route = useRoute<RouteProp<AuthStackParamList, 'Register'>>();
  const hasInvite = Boolean(route.params?.hasInvite);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ displayName: displayName.trim(), email: email.trim(), password });

      if (inviteCode.trim()) {
        try {
          await pactService.acceptInvite(inviteCode.trim().toUpperCase());
          await refreshUser();
        } catch (inviteErr) {
          // Account creation still succeeded — let them retry the code from
          // onboarding instead of losing the account they just made.
          setError(
            inviteErr instanceof ApiRequestError
              ? `Account created, but that invite code didn't work: ${inviteErr.message}`
              : "Account created, but that invite code didn't work.",
          );
        }
      }
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
      <TextField
        label={hasInvite ? 'Invite code' : 'Invite code (optional)'}
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
        placeholder="PACT-XXXXXX"
      />
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
