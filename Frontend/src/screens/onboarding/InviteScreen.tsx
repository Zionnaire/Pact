import React, { useEffect, useState } from 'react';
import { View, Text, Share, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Screen, OnboardingHeader, TextField, Button } from '../../components';
import { pactService } from '../../services/pact.service';
import { useAuth } from '../../contexts/AuthContext';
import type { OnboardingStackParamList } from '../../Navigations/types';
import { ApiRequestError } from '../../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{6,}$/;

export function InviteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { user } = useAuth();

  const [theirName, setTheirName] = useState('');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    pactService
      .createInvite('link')
      .then(({ invite, inviteLink }) => {
        setCode(invite.code);
        setLink(inviteLink);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Could not create an invite'));
  }, []);

  const message = `${user?.displayName ?? 'Your partner'} wants to build something honest with you. ${link ?? ''}`;

  const handleSend = async () => {
    if (!link) return;
    setIsSending(true);
    try {
      if (PHONE_RE.test(contact.trim())) {
        await Linking.openURL(`sms:${contact.trim()}?body=${encodeURIComponent(message)}`);
      } else if (EMAIL_RE.test(contact.trim())) {
        await Linking.openURL(`mailto:${contact.trim()}?subject=${encodeURIComponent('An invite to Pact')}&body=${encodeURIComponent(message)}`);
      } else {
        await Share.share({ message });
      }
      navigation.navigate('Cycle');
    } catch {
      await Share.share({ message }).catch(() => undefined);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async () => {
    if (link) await Clipboard.setStringAsync(link);
  };

  return (
    <Screen>
      <OnboardingHeader step={2} />

      <Animated.View entering={FadeInDown.duration(500)}>
        <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Step 2 of 4</Text>
        <Text className="mt-3 font-serif text-3xl leading-tight text-brand-plum">Bring them in.</Text>
        <Text className="mt-3 text-[13px] text-brand-ink/50">Your pact is for two. Invite the one you're building this with.</Text>
      </Animated.View>

      <View className="mt-6">
        <TextField label="Their name" value={theirName} onChangeText={setTheirName} autoCapitalize="words" />
        <TextField
          label="Phone or email"
          value={contact}
          onChangeText={setContact}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="+234 802 000 0000"
        />
      </View>

      {!code && !error && (
        <View className="items-center py-6">
          <ActivityIndicator color="#5B1F24" />
        </View>
      )}
      {error && <Text className="text-[13px] text-type-rant">{error}</Text>}

      {code && link && (
        <Animated.View entering={FadeIn.duration(400)} className="mt-2 rounded-3xl bg-brand-plum p-6">
          <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-gold">They'll see</Text>
          <Text className="mt-2 font-serif text-lg italic leading-snug text-brand-paper">
            "{user?.displayName ?? 'Your partner'} wants to build something honest with you."
          </Text>
          <View className="mt-4 flex-row items-center justify-between rounded-xl bg-brand-paper/10 px-3 py-2">
            <Text className="flex-1 text-[11px] text-brand-paper/70" numberOfLines={1}>
              {link.replace(/^https?:\/\//, '')}
            </Text>
            <Ionicons name="copy-outline" size={16} color="#F9F7F2" onPress={handleCopy} />
          </View>
        </Animated.View>
      )}

      <View className="mt-6">
        <Button label="Send invite" icon="paper-plane" onPress={handleSend} loading={isSending} disabled={!link} />
        <Text
          onPress={() => navigation.navigate('Cycle')}
          className="mt-3 text-center text-[11px] font-sans-semibold uppercase tracking-[0.15em] text-brand-ink/40"
        >
          Share link instead
        </Text>
      </View>
    </Screen>
  );
}
