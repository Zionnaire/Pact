import React, { useState } from 'react';
import { Text } from 'react-native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { pactService } from '../../services/pact.service';
import { ApiRequestError } from '../../types';

/** Already-registered, already-authenticated, just unpaired — a plain code redeem, no name needed. */
export function JoinPactScreen() {
  const { refreshUser } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await pactService.acceptInvite(code.trim().toUpperCase());
      await refreshUser();
      // RootNavigator switches to MainNavigator automatically once pactId is set.
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not join with that code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Join with a code" showBack />
      <Text className="mb-6 text-[13px] leading-5 text-brand-ink/60">
        Enter the invite code your partner shared with you.
      </Text>
      <TextField
        label="Invite code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        placeholder="PACT-XXXXXX"
      />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Join pact" onPress={handleSubmit} loading={isSubmitting} disabled={!code.trim()} />
    </Screen>
  );
}
