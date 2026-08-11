import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Screen,
  AppHeader,
  Avatar,
  Button,
  EntryCard,
  EmptyState,
  SkeletonLoader,
  SwipeToDelete,
} from '../../components';
import { usePact } from '../../contexts/PactContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePartner } from '../../hooks';
import { useMyEntries } from '../../hooks';
import { entryService } from '../../services/entry.service';
import { entryTypeLabel } from '../../theme/tokens';
import type { MainStackParamList } from '../../Navigations/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatOpensIn(revealAt: string, now: number) {
  const diffMs = Math.max(0, new Date(revealAt).getTime() - now);
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  return { days, hours, minutes };
}

export function VaultScreen() {
  const navigation = useNavigation();
  const parentNav = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const partner = usePartner();
  const { snapshot } = usePact();
  const { data: entries, isLoading, refetch } = useMyEntries(snapshot?.cycle?._id);
  const canDelete = snapshot?.cycle?.status === 'open';
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Delete entry', 'This entry will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await entryService.remove(id); refetch(); } },
    ]);
  };

  const cycle = snapshot?.cycle ?? null;
  const opens = cycle ? formatOpensIn(cycle.revealAt, now) : null;
  const revealDayName = snapshot ? DAY_NAMES[snapshot.pact.revealDay] : '';
  const lastCycle = snapshot?.lastCyclePreview;

  return (
    <Screen>
      <AppHeader title="Vault" />

      {cycle && (
        <>
          <Text className="text-[10px] font-sans-semibold uppercase tracking-[0.2em] text-brand-clay">
            Cycle {cycle.index + 1}{cycle.name ? ` · ${cycle.name.toUpperCase()}` : ''}
          </Text>
          <Text className="mt-1 font-serif text-2xl text-brand-plum">
            {cycle.status === 'open' ? `Sealed until ${revealDayName}.` : cycle.status === 'ready' ? 'Ready to open.' : 'Revealed.'}
          </Text>
        </>
      )}

      {cycle?.status === 'open' && opens && (
        <View className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-brand-ink/5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={13} color="rgba(30,30,30,0.4)" />
            <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-ink/40">Opens in</Text>
          </View>
          <View className="mt-2 flex-row gap-6">
            {[{ v: opens.days, l: 'Days' }, { v: opens.hours, l: 'Hrs' }, { v: opens.minutes, l: 'Min' }].map((item) => (
              <View key={item.l}>
                <Text className="font-serif text-3xl text-brand-plum" style={{ fontVariant: ['tabular-nums'] }}>
                  {item.v.toString().padStart(2, '0')}
                </Text>
                <Text className="text-[10px] text-brand-ink/40">{item.l}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {cycle?.status === 'ready' && user && (
        <View className="mt-4 overflow-hidden rounded-3xl">
          <LinearGradient colors={['#5B1F24', '#3A1218']} style={{ padding: 20 }}>
            <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-gold">Dual consent</Text>
            <Text className="mt-1 font-serif text-lg text-brand-paper">Both of you must be ready.</Text>
            <View className="mt-4 flex-row items-center justify-center gap-8">
              <View className="items-center">
                <Avatar avatarUrl={user.avatarUrl} avatarInitial={user.avatarInitial} size={48} />
                <Text className="mt-1.5 text-[10px] text-brand-paper/60">You</Text>
              </View>
              <View className="items-center">
                {partner ? (
                  <Avatar avatarUrl={partner.avatarUrl} avatarInitial={partner.avatarInitial} size={48} />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-paper/10">
                    <Text className="text-brand-paper/40">?</Text>
                  </View>
                )}
                <Text className="mt-1.5 text-[10px] text-brand-paper/60">{partner?.displayName ?? 'Partner'}</Text>
              </View>
            </View>
            <View className="mt-5">
              <Button
                label="I'm ready to reveal"
                onPress={() => parentNav?.navigate('Reveal', { cycleId: cycle._id })}
              />
            </View>
          </LinearGradient>
        </View>
      )}

      {snapshot?.nextTalk && (
        <View className="mt-4 rounded-2xl border border-type-need/30 bg-type-need/10 p-4">
          <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-clay">Scheduled talk</Text>
          <Text className="mt-1 text-[13px] text-brand-ink/70">
            {new Date(snapshot.nextTalk.scheduledFor).toLocaleString(undefined, {
              weekday: 'long',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      {lastCycle && lastCycle.entries.length > 0 && (
        <View className="mt-6">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-serif text-lg text-brand-ink">Last cycle · opened</Text>
            <Pressable onPress={() => parentNav?.navigate('Reveal', { cycleId: lastCycle.cycle._id })}>
              <Text className="text-[11px] font-sans-semibold uppercase tracking-[0.1em] text-brand-clay">Read</Text>
            </Pressable>
          </View>
          {lastCycle.entries.map((entry) => (
            <View key={entry._id} className="mb-2 rounded-2xl bg-white p-3 ring-1 ring-brand-ink/5">
              <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.15em] text-brand-clay">
                From {entry.authorId ? (entry.authorId.id === user?.id ? 'you' : entry.authorId.displayName) : 'your partner'}
                {' · '}
                {entryTypeLabel[entry.type]}
              </Text>
              {entry.body && <Text className="mt-1 font-serif italic text-[13px] text-brand-ink/70">"{entry.body}"</Text>}
            </View>
          ))}
        </View>
      )}

      <View className="mb-3 mt-8">
        <Text className="font-serif text-lg text-brand-ink">This cycle's drops</Text>
      </View>

      {isLoading && (
        <>
          <SkeletonLoader height={100} className="mb-3" />
          <SkeletonLoader height={100} className="mb-3" />
        </>
      )}

      {!isLoading && entries?.length === 0 && (
        <EmptyState icon="lock-closed-outline" title="Nothing dropped yet" description="Tap the + button to write your first entry this cycle." />
      )}

      {entries?.map((entry, index) => (
        <SwipeToDelete key={entry._id} disabled={!canDelete} onDelete={() => handleDelete(entry._id)}>
          <EntryCard entry={entry} index={index} />
        </SwipeToDelete>
      ))}

      <Animated.View entering={FadeIn.delay(300)}>
        <Text className="mb-2 mt-6 text-center text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-ink/30">
          Encrypted · Opened only together
        </Text>
      </Animated.View>
    </Screen>
  );
}
