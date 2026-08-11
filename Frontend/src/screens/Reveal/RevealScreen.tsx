import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import {
  TopBar,
  Button,
  ConsentLock,
  EntryCard,
  AmbientBackground,
  UnsealingCeremony,
  ReactionChips,
  ResolutionRow,
} from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { usePact } from '../../contexts/PactContext';
import { usePartner } from '../../hooks';
import { revealService } from '../../services/reveal.service';
import { responseService } from '../../services/response.service';
import { entryService } from '../../services/entry.service';
import { connectSocket, disconnectSocket } from '../../services/socket';
import type { MainStackParamList } from '../../Navigations/types';
import type { RevealedEntry, ReactionKind, ResolutionStatus } from '../../types';
import { ApiRequestError } from '../../types';

type Phase = 'loading' | 'consent' | 'unsealing' | 'revealed';

// How long the ceremony transition plays before the entries render.
const UNSEALING_DURATION_MS = 1800;
const MAX_REVEAL_DELAYS = 2;

export function RevealScreen() {
  const navigation = useNavigation();
  const parentNav = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'Reveal'>>();
  const { cycleId } = route.params;
  const { user } = useAuth();
  const { snapshot, refresh } = usePact();
  const partner = usePartner();

  const [phase, setPhase] = useState<Phase>('loading');
  const [readyUserIds, setReadyUserIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<RevealedEntry[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isDelaying, setIsDelaying] = useState(false);
  const [delaysUsed, setDelaysUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    revealService
      .getRevealed(cycleId)
      .then((data) => {
        if (!mounted) return;
        setEntries(data.entries);
        setPhase('revealed');
      })
      .catch(() => {
        if (mounted) setPhase('consent');
      });

    return () => {
      mounted = false;
    };
  }, [cycleId]);

  useEffect(() => {
    if (snapshot?.cycle?._id === cycleId) setDelaysUsed(snapshot.cycle.delaysUsed);
  }, [snapshot, cycleId]);

  useEffect(() => {
    if (phase !== 'consent' || !snapshot?.pact._id) return undefined;

    let active = true;
    connectSocket().then((socket) => {
      socket.emit('join:pact', snapshot.pact._id);
      socket.on('reveal:state', (state: { readyUserIds: string[]; bothReady: boolean }) => {
        if (active) setReadyUserIds(state.readyUserIds);
      });
      socket.on('reveal:open', () => {
        if (!active) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        setPhase('unsealing');
        revealService.getRevealed(cycleId).then((data) => {
          if (!active) return;
          setEntries(data.entries);
          setTimeout(() => active && setPhase('revealed'), UNSEALING_DURATION_MS);
        });
      });
    });

    return () => {
      active = false;
      disconnectSocket();
    };
  }, [phase, snapshot?.pact._id, cycleId]);

  const selfConsented = user ? readyUserIds.includes(user.id) : false;
  const partnerConsented = partner ? readyUserIds.includes(partner.id) : false;
  const bothReady = selfConsented && partnerConsented;
  const revealTimeArrived = snapshot?.cycle ? new Date(snapshot.cycle.revealAt).getTime() <= Date.now() : true;

  const toggleConsent = async (consent: boolean) => {
    setError(null);
    try {
      const result = await revealService.toggleConsent(cycleId, consent);
      if (!result.bothConsented) {
        setReadyUserIds((ids) => (consent
          ? Array.from(new Set([...ids, user!.id]))
          : ids.filter((id) => id !== user!.id)));
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not update consent');
    }
  };

  const handleDelay = async () => {
    setIsDelaying(true);
    setError(null);
    try {
      const updated = await revealService.requestDelay(cycleId);
      setDelaysUsed(updated.delaysUsed);
      setReadyUserIds([]);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not delay the reveal');
    } finally {
      setIsDelaying(false);
    }
  };

  const handleReveal = async () => {
    setIsRevealing(true);
    setError(null);
    try {
      await revealService.reveal(cycleId);
      const data = await revealService.getRevealed(cycleId);
      setEntries(data.entries);
      setPhase('unsealing');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setTimeout(() => setPhase('revealed'), UNSEALING_DURATION_MS);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Reveal failed — try again');
    } finally {
      setIsRevealing(false);
    }
  };

  const handleRespond = async (entryId: string, body: string) => {
    await responseService.respond(entryId, body);
    const data = await revealService.getRevealed(cycleId);
    setEntries(data.entries);
  };

  const handleReaction = async (entryId: string, reaction: ReactionKind) => {
    await entryService.setReaction(entryId, reaction);
    const data = await revealService.getRevealed(cycleId);
    setEntries(data.entries);
  };

  const handleResolution = async (entryId: string, status: ResolutionStatus) => {
    await responseService.setResolution(entryId, status);
    const data = await revealService.getRevealed(cycleId);
    setEntries(data.entries);
  };

  if (phase === 'loading') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-brand-plum-deep">
        <ActivityIndicator color="#D4AF37" />
      </SafeAreaView>
    );
  }

  if (phase === 'consent') {
    const delaysLeft = MAX_REVEAL_DELAYS - delaysUsed;
    return (
      <SafeAreaView className="flex-1 bg-brand-plum-deep px-6" edges={['top', 'left', 'right']}>
        <AmbientBackground variant="ceremony" />
        <View className="mt-2">
          <TopBar title="Reveal" showBack dark />
        </View>
        {user && (
          <ConsentLock self={user} partner={partner} selfConsented={selfConsented} partnerConsented={partnerConsented} />
        )}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} className="mt-8 gap-3">
          {!selfConsented ? (
            <Button label="I'm ready to reveal" onPress={() => toggleConsent(true)} />
          ) : (
            <Button label="Not yet — hold off" variant="secondary" onPress={() => toggleConsent(false)} />
          )}
          {bothReady && revealTimeArrived && (
            <Button label="Unlock the vault" variant="primary" onPress={handleReveal} loading={isRevealing} />
          )}
          {delaysLeft > 0 ? (
            <Pressable onPress={handleDelay} disabled={isDelaying} className="min-h-11 items-center justify-center">
              <Text className="text-[12px] text-brand-paper/50">
                {isDelaying ? 'Requesting…' : `Request a 24-hour delay (${delaysLeft} left)`}
              </Text>
            </Pressable>
          ) : (
            <Text className="text-center text-[12px] text-brand-paper/30">No delays left for this cycle</Text>
          )}
        </Animated.View>
        {error && <Text className="mt-4 text-center text-[13px] text-type-rant">{error}</Text>}
      </SafeAreaView>
    );
  }

  if (phase === 'unsealing') {
    return <UnsealingCeremony />;
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-plum-deep" edges={['top', 'left', 'right']}>
      <AmbientBackground variant="ceremony" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-2">
          <TopBar title="" showBack dark />
        </View>

        <Animated.View entering={FadeIn.duration(500)} className="items-center">
          <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.25em] text-brand-gold">
            {user?.displayName}{partner ? ` & ${partner.displayName}` : ''}
          </Text>
          <View className="mt-4 h-14 w-14 items-center justify-center rounded-full border border-brand-gold/40">
            <Ionicons name="sparkles" size={20} color="#D4AF37" />
          </View>
          <Text className="mt-4 text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-paper/40">
            Ceremony{snapshot?.cycle ? ` · Cycle ${snapshot.cycle.index + 1}` : ''}
          </Text>
          <Text className="mt-1 font-serif text-3xl italic text-brand-paper">Opening now.</Text>
          <Text className="mt-2 text-center text-[13px] text-brand-paper/50">
            This moment is yours together. Take your time.
          </Text>
        </Animated.View>

        <View className="mt-8">
          {entries.length === 0 && (
            <Text className="text-center text-[13px] text-brand-paper/50">No entries were dropped this cycle.</Text>
          )}
          {entries.map(({ entry, isAnonymous, responses, resolution, reactions }, index) => {
            const isMine = entry.authorId === user?.id;
            const fromLabel = isMine ? 'From you' : isAnonymous ? 'From your partner' : `From ${partner?.displayName ?? 'your partner'}`;
            const myReaction = reactions.find((r) => r.userId === user?.id)?.reaction;

            return (
              <View key={entry._id} className="mb-4">
                <EntryCard entry={entry} index={index} ceremonial fromLabel={fromLabel.replace('From ', '').toUpperCase()}>
                  {!isMine && <ReactionChips value={myReaction} onChange={(r) => handleReaction(entry._id, r)} />}
                  <ResolutionRow
                    value={resolution?.status ?? null}
                    onChange={(status) => handleResolution(entry._id, status)}
                    onScheduleTalk={() => parentNav?.navigate('Talk')}
                  />
                  {responses.map((response) => (
                    <View key={response._id} className="rounded-2xl bg-brand-plum/5 p-3">
                      <Text className="text-[13px] text-brand-ink/80">{response.body}</Text>
                    </View>
                  ))}
                  {!isMine && <RespondRow entryId={entry._id} onSubmit={(body) => handleRespond(entry._id, body)} />}
                </EntryCard>
              </View>
            );
          })}
        </View>

        <View className="mt-4">
          <Button label="Close the ceremony" onPress={() => navigation.goBack()} />
        </View>
        <Text className="mb-2 mt-4 text-center text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-paper/30">
          Resolved with intention
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RespondRow({ entryId, onSubmit }: { entryId: string; onSubmit: (body: string) => Promise<void> }) {
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const send = async () => {
    if (!body.trim()) return;
    setIsSending(true);
    try {
      await onSubmit(body.trim());
      setBody('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View className="flex-row items-center gap-2">
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Write a response…"
        placeholderTextColor="rgba(30,30,30,0.3)"
        accessibilityLabel="Response"
        className="min-h-11 flex-1 rounded-full border border-brand-ink/10 bg-white px-4 py-2 text-[13px] text-brand-ink"
      />
      <Button label={isSending ? '…' : 'Send'} fullWidth={false} onPress={send} disabled={isSending || !body.trim()} />
    </View>
  );
}
