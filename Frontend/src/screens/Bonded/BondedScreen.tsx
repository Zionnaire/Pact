import React, { useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { Screen, TopBar, TextField, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks';
import { subscriptionService } from '../../services/subscription.service';
import { ApiRequestError } from '../../types';

const PERKS = [
  'Unlimited themes & pattern history',
  'Extended Pulse history beyond 6 cycles',
  'Priority AI tone-check',
];

export function BondedScreen() {
  const { user } = useAuth();
  const { data: subscription } = useAsync(() => subscriptionService.get(), []);
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBonded = subscription?.tier === 'bonded';

  const handleCheckout = async () => {
    if (!email.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const { authorization_url } = await subscriptionService.checkout(email.trim());
      await Linking.openURL(authorization_url);
    } catch (err) {
      if (err instanceof ApiRequestError && err.statusCode === 501) {
        setError('Bonded upgrades aren\'t open yet — check back soon.');
      } else {
        setError(err instanceof ApiRequestError ? err.message : 'Could not start checkout');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Bonded" showBack />

      <View className="mb-6 items-center rounded-3xl bg-brand-plum p-8">
        <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-gold">
          {isBonded ? 'You are Bonded' : 'Upgrade'}
        </Text>
        <Text className="mt-2 font-serif text-3xl text-brand-paper">Pact Bonded</Text>
      </View>

      {PERKS.map((perk) => (
        <View key={perk} className="mb-3 flex-row items-center gap-3">
          <View className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
          <Text className="text-[14px] text-brand-ink/80">{perk}</Text>
        </View>
      ))}

      {!isBonded && (
        <View className="mt-6">
          <TextField label="Email for receipt" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
          <Button label="Upgrade to Bonded" onPress={handleCheckout} loading={isSubmitting} disabled={!email.trim()} />
        </View>
      )}
    </Screen>
  );
}
