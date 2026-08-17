import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../types';

/**
 * Shown to a "quick join" account (see pact.controller.ts quickJoinInvite)
 * — they joined with just a name, so there's no email/phone or real
 * password to log back in with elsewhere. Setting those here lifts the
 * server-side gate on dropping entries (entry.routes.ts
 * requireCompleteProfile) — reachable anytime from Pact tab → Settings,
 * not forced immediately, since looking around shouldn't require it.
 */
export function CompleteProfileScreen() {
  const navigation = useNavigation();
  const { completeProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await completeProfile({ email: email.trim(), password });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not complete your profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Complete your profile" showBack />

      <View className="mb-6 flex-row items-start gap-3 rounded-2xl bg-type-need/10 p-4">
        <Ionicons name="information-circle-outline" size={18} color="#E29578" style={{ marginTop: 2 }} />
        <Text className="flex-1 text-[13px] leading-5 text-brand-ink/70">
          You joined with just your name, so right now only this device can reach your account. Add an email and password so you can log in anywhere — and so you can start dropping entries.
        </Text>
      </View>

      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Save" onPress={handleSubmit} loading={isSubmitting} disabled={!email.trim() || password.length < 8} />
    </Screen>
  );
}
