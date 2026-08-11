import React, { useState } from 'react';
import { View, Text, Pressable, Share, Alert } from 'react-native';
import { Screen, TopBar, TextField, Button, EmptyState, SkeletonLoader } from '../../components';
import { useTherapistGrants } from '../../hooks';
import { therapistService } from '../../services/therapist.service';
import type { TherapistScope } from '../../types';
import { ApiRequestError } from '../../types';

const SCOPES: TherapistScope[] = ['summary', 'themes', 'pulse_history'];

export function TherapistScreen() {
  const { data: grants, isLoading, refetch } = useTherapistGrants();
  const [email, setEmail] = useState('');
  const [scopes, setScopes] = useState<TherapistScope[]>(['summary']);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleScope = (scope: TherapistScope) => {
    setScopes((current) => (current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope]));
  };

  const handleGrant = async () => {
    if (!email.trim() || scopes.length === 0) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const { portalLink: link } = await therapistService.grant(email.trim(), scopes);
      setPortalLink(link);
      setEmail('');
      refetch();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not create access');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = (id: string) => {
    Alert.alert('Revoke access', 'This link will stop working immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => therapistService.revoke(id).then(refetch) },
    ]);
  };

  return (
    <Screen>
      <TopBar title="Therapist portal" showBack />
      <Text className="mb-6 text-[13px] leading-5 text-brand-ink/50">
        Grants read-only aggregate access — scores, themes, resolution counts. Entry text is never shared.
      </Text>

      <TextField label="Therapist email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <Text className="mb-2 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Access includes</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {SCOPES.map((scope) => (
          <Pressable
            key={scope}
            onPress={() => toggleScope(scope)}
            className="min-h-11 rounded-full px-4 py-2 ring-1 ring-brand-ink/10"
            style={{ backgroundColor: scopes.includes(scope) ? '#5B1F24' : '#ffffff' }}
          >
            <Text style={{ color: scopes.includes(scope) ? '#F9F7F2' : 'rgba(30,30,30,0.6)' }}>
              {scope.replace('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text className="mb-4 text-[13px] text-type-rant">{error}</Text>}
      <Button label="Grant access" onPress={handleGrant} loading={isSubmitting} disabled={!email.trim()} />

      {portalLink && (
        <View className="mt-4 rounded-2xl bg-brand-plum/5 p-4">
          <Text className="mb-2 text-[12px] text-brand-ink/60">Share this link with your therapist:</Text>
          <Button label="Share portal link" variant="secondary" onPress={() => Share.share({ message: portalLink })} />
        </View>
      )}

      <View className="mb-3 mt-8 h-px bg-brand-ink/10" />
      <Text className="mb-3 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Active grants</Text>

      {isLoading && <SkeletonLoader height={60} className="mb-3" />}
      {!isLoading && grants?.length === 0 && (
        <EmptyState icon="medkit-outline" title="No one has access" description="Grant a therapist read-only access above." />
      )}
      {grants?.filter((g) => !g.revokedAt).map((grant) => (
        <View key={grant._id} className="mb-2 flex-row items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-brand-ink/5">
          <View className="flex-1">
            <Text className="text-[14px] text-brand-ink">{grant.therapistEmail}</Text>
            <Text className="mt-1 text-[11px] text-brand-ink/40">
              Expires {new Date(grant.expiresAt).toLocaleDateString()}
            </Text>
          </View>
          <Pressable onPress={() => handleRevoke(grant._id)} className="min-h-11 justify-center px-2">
            <Text className="text-[13px] text-type-rant">Revoke</Text>
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}
