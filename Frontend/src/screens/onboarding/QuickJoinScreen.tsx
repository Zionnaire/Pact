import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../types';
import type { AuthStackParamList } from '../../Navigations/types';

/**
 * For someone who got an invite code but has no Pact account yet — a name
 * and a code is all it takes to get in and see their pact. No password, no
 * email: those come later (Pact tab → nudge to complete profile), and
 * dropping entries is blocked server-side until then, so nothing precious
 * gets written into an account only this one device can reach.
 */
export function QuickJoinScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { quickJoin } = useAuth();

  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await quickJoin(code.trim().toUpperCase(), displayName.trim());
      // RootNavigator switches to MainNavigator automatically once user + pactId are set.
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
        Enter the invite code your partner shared, and your name — that's all it takes to see your pact. You can add an email and password later.
      </Text>
      <TextField
        label="Invite code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        placeholder="PACT-XXXXXX"
      />
      <TextField label="Your name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Join" onPress={handleSubmit} loading={isSubmitting} disabled={!code.trim() || !displayName.trim()} />
      <Pressable
        onPress={() => navigation.navigate('Login', { inviteCode: code.trim().toUpperCase() || undefined })}
        className="mt-4 min-h-11 items-center justify-center"
      >
        <Text className="text-[12px] text-brand-ink/40">Already have an account? Log in instead</Text>
      </Pressable>
    </Screen>
  );
}
