import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { AppHeader, QuickActionTile, PatternCard, SkeletonLoader, Button, AmbientBackground } from '../../components';
import { usePact } from '../../contexts/PactContext';
import { useAuth } from '../../contexts/AuthContext';
import { entryTypeColor, entryTypeLabel } from '../../theme/tokens';
import { useResponsive, MAX_CONTENT_WIDTH } from '../../utils/responsive';
import type { MainStackParamList, MainTabParamList } from '../../Navigations/types';
import type { Entry } from '../../types';

function formatCountdown(revealAt: string): string {
  const diffMs = Math.max(0, new Date(revealAt).getTime() - Date.now());
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function RecentDropRow({ entry, index }: { entry: Entry; index: number }) {
  const color = entryTypeColor[entry.type];
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 6) * 70).duration(400)}
      className="mb-3 rounded-2xl bg-white p-4"
      style={{ shadowColor: '#1E1E1E', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}22` }}>
          <Text style={{ color }} className="text-[9px] font-sans-semibold uppercase tracking-[0.15em]">
            {entryTypeLabel[entry.type]}
          </Text>
        </View>
        <Text className="text-[10px] text-brand-ink/30">
          {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
      {entry.body && (
        <Text numberOfLines={2} className="mt-2 font-serif italic text-[14px] leading-5 text-brand-ink/80">
          "{entry.body}"
        </Text>
      )}
      {entry.mood && (
        <View className="mt-2 flex-row items-center gap-1.5">
          <View style={{ backgroundColor: color }} className="h-1.5 w-1.5 rounded-full" />
          <Text className="text-[11px] text-brand-ink/40">{entry.mood}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const { snapshot, isLoading, refresh } = usePact();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const parentNav = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  const [now, setNow] = useState(Date.now());
  const { isTablet, gutter } = useResponsive();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const cycle = snapshot?.cycle ?? null;
  const mySealed = user ? snapshot?.sealedCounts[user.id] ?? 0 : 0;

  const dayOfCycle = cycle
    ? Math.min(
        Math.floor((now - new Date(cycle.startsAt).getTime()) / (24 * 60 * 60 * 1000)) + 1,
        snapshot!.pact.cycleLengthDays,
      )
    : 0;
  const progress = cycle ? Math.min(dayOfCycle / snapshot!.pact.cycleLengthDays, 1) : 0;

  return (
    <SafeAreaView className="flex-1 bg-brand-paper" edges={['top', 'left', 'right']}>
      <AmbientBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#5B1F24" />}
      >
        <View style={isTablet ? { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' } : undefined}>
        <AppHeader title="Pact" />

        <Animated.View entering={FadeIn.duration(400)}>
          <Text className="text-[13px] text-brand-ink/40">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text className="mt-1 font-serif text-2xl text-brand-plum">
            {greeting()}{user ? `, ${user.displayName.split(' ')[0]}.` : '.'}
          </Text>
        </Animated.View>

        {isLoading && !snapshot ? (
          <SkeletonLoader height={170} className="my-6" />
        ) : cycle ? (
          <View
            className="my-6 overflow-hidden rounded-3xl"
            style={{ shadowColor: '#3A1218', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 7 }}
          >
            <LinearGradient colors={['#5B1F24', '#3A1218']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
              <LinearGradient
                pointerEvents="none"
                colors={['#D4AF3745', '#D4AF3700']}
                style={{ position: 'absolute', top: -70, right: -50, width: 180, height: 180, borderRadius: 90 }}
              />

              <View className="flex-row items-center justify-between">
                <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-gold">Current cycle</Text>
                <View className="rounded-full bg-brand-paper/15 px-2.5 py-1">
                  <Text className="text-[10px] text-brand-paper">Day {dayOfCycle} of {snapshot!.pact.cycleLengthDays}</Text>
                </View>
              </View>
              <Text className="mt-1.5 font-serif text-xl text-brand-paper">{cycle.name || snapshot!.pact.name}</Text>

              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-[11px] text-brand-gold">Your drops: {mySealed}</Text>
                <Text className="text-[11px] text-brand-paper/50">Partner's: ? (sealed)</Text>
              </View>
              <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-paper/15">
                <View className="h-full rounded-full bg-brand-gold" style={{ width: `${progress * 100}%` }} />
              </View>

              <View className="mt-5 flex-row items-end justify-between">
                <View>
                  <Text className="text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-paper/50">
                    Reveal countdown
                  </Text>
                  <Text className="mt-1 font-serif text-2xl text-brand-paper" style={{ fontVariant: ['tabular-nums'] }}>
                    {formatCountdown(cycle.revealAt)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => navigation.navigate('Vault')}
                  className="min-h-11 items-center justify-center rounded-full bg-brand-gold px-5 active:opacity-80"
                >
                  <Text className="text-[13px] font-sans-semibold text-brand-plum-deep">Open vault</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View className="my-6 rounded-3xl bg-white p-6 ring-1 ring-brand-ink/5">
            <Text className="text-center text-[13px] text-brand-ink/50">No active cycle yet.</Text>
          </View>
        )}

        <View className="flex-row gap-3">
          <QuickActionTile
            eyebrow="Quick"
            label="Check-in"
            icon="sparkles-outline"
            onPress={() => parentNav?.navigate('Drop')}
          />
          <QuickActionTile
            eyebrow="Voice"
            label="Speak it"
            icon="mic-outline"
            onPress={() => parentNav?.navigate('Drop')}
          />
        </View>

        <View className="mb-3 mt-8 flex-row items-center justify-between">
          <Text className="font-serif text-lg text-brand-ink">Your recent drops</Text>
          <Pressable onPress={() => navigation.navigate('Vault')} accessibilityRole="button" accessibilityLabel="View all">
            <Text className="text-[11px] font-sans-semibold uppercase tracking-[0.1em] text-brand-clay">View all</Text>
          </Pressable>
        </View>

        {snapshot?.recentEntries?.length ? (
          snapshot.recentEntries.slice(0, 3).map((entry, index) => <RecentDropRow key={entry._id} entry={entry} index={index} />)
        ) : (
          <Text className="text-[13px] text-brand-ink/40">Nothing dropped yet this cycle.</Text>
        )}

        {snapshot?.topTheme && (
          <View className="mt-2">
            <PatternCard theme={snapshot.topTheme} />
          </View>
        )}

        <View className="mt-6">
          <Button label="Drop into vault" onPress={() => parentNav?.navigate('Drop')} />
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
