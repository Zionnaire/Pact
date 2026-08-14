import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { ApiRequestError } from '../../types';

export function DeleteAccountScreen() {
  const navigation = useNavigation();
  const { user, deleteAccount } = useAuth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteAccount(password);
      // RootNavigator switches to AuthStack automatically once user becomes null.
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not delete your account');
      setIsDeleting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Delete account" showBack />

      <View className="mb-6 flex-row items-start gap-3 rounded-2xl bg-type-rant/10 p-4">
        <Ionicons name="warning-outline" size={18} color="#E5989B" style={{ marginTop: 2 }} />
        <Text className="flex-1 text-[13px] leading-5 text-brand-ink/70">This can't be undone. Deleting your account will:</Text>
      </View>

      <View className="mb-6 gap-3">
        <Text className="text-[13px] text-brand-ink/70">• Remove your name, email/phone, and photo immediately</Text>
        <Text className="text-[13px] text-brand-ink/70">• Permanently delete any entries you wrote that were never revealed to {user?.pactId ? 'your partner' : 'anyone'}</Text>
        {user?.pactId && (
          <Text className="text-[13px] text-brand-ink/70">• End your pact — your partner keeps what you already mutually revealed, but the pact stops here</Text>
        )}
        <Text className="text-[13px] text-brand-ink/70">• Sign you out everywhere</Text>
      </View>

      <Text className="mb-4 text-[13px] text-brand-ink/50">
        Want to keep a copy of your own words first? Go back and use Settings → Export my data before deleting.
      </Text>

      <TextField
        label="Confirm your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
      />

      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}

      <Button label="Delete my account" variant="danger" onPress={handleDelete} loading={isDeleting} disabled={!password} />
    </Screen>
  );
}
