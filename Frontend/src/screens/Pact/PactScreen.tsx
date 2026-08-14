import React, { useState } from 'react';
import { View, Text, Alert, Pressable, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import * as Clipboard from 'expo-clipboard';
import { Screen, AppHeader, HeroStatsCard, SheetRow, Button } from '../../components';
import { usePact } from '../../contexts/PactContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePartner, usePulse } from '../../hooks';
import { checkAndApplyUpdate } from '../../utils/updates';
import { authService } from '../../services/auth.service';
import { API_BASE_URL, PUBLIC_API_BASE_URL } from '../../config/env';
import { ApiRequestError } from '../../types';
import type { MainStackParamList } from '../../Navigations/types';

export function PactScreen() {
  const navigation = useNavigation();
  const parentNav = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  const { snapshot } = usePact();
  const { user, logout } = useAuth();
  const partner = usePartner();
  const { data: pulse } = usePulse();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCheckForUpdate = async () => {
    setIsCheckingUpdate(true);
    const result = await checkAndApplyUpdate();
    setIsCheckingUpdate(false);
    if (!result.applied) Alert.alert('Updates', result.message);
  };

  const handleCopyApiUrl = async () => {
    await Clipboard.setStringAsync(API_BASE_URL);
    Alert.alert('Copied', API_BASE_URL);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { entryCount, entries } = await authService.exportData();
      if (entryCount === 0) {
        Alert.alert('Nothing to export yet', "You haven't written any entries.");
        return;
      }
      await Share.share({
        title: 'My Pact entries',
        message: JSON.stringify(entries, null, 2),
      });
    } catch (err) {
      Alert.alert('Export failed', err instanceof ApiRequestError ? err.message : 'Could not export your data right now');
    } finally {
      setIsExporting(false);
    }
  };

  const cycles = snapshot?.cycle ? snapshot.cycle.index + 1 : 0;
  const pairedSince = snapshot?.pact.createdAt
    ? new Date(snapshot.pact.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : undefined;

  return (
    <Screen>
      <AppHeader title="Our Pact" />

      {user && (
        <HeroStatsCard
          self={user}
          partner={partner}
          pairedSince={pairedSince}
          cycles={cycles}
          weekStreak={snapshot?.streak ?? 0}
          resolvedPct={pulse ? Math.round(pulse.resolutionRate * 100) : 0}
        />
      )}

      <Pressable
        onPress={() => parentNav?.navigate('Talk')}
        className="mt-4 min-h-11 flex-row items-center gap-3 rounded-2xl border border-type-need/30 bg-type-need/10 p-4 active:opacity-80"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <Ionicons name="heart" size={16} color="#E29578" />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] text-brand-ink">Schedule a talk</Text>
          <Text className="text-[12px] text-brand-ink/50">Pick a time to sit with each other</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(30,30,30,0.3)" />
      </Pressable>

      <Text className="mb-2 mt-8 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Account</Text>
      <View className="mb-2 rounded-2xl bg-white ring-1 ring-brand-ink/5">
        <View className="px-4">
          <SheetRow icon="person-circle-outline" label="Edit profile" description="Name, photo, bio" onPress={() => parentNav?.navigate('EditProfile')} />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow
            icon="download-outline"
            label={isExporting ? 'Preparing…' : 'Export my data'}
            description="Every entry you've written, as JSON"
            onPress={handleExportData}
            showChevron={false}
          />
        </View>
      </View>

      <Text className="mb-2 mt-6 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Settings</Text>
      <View className="mb-2 rounded-2xl bg-white ring-1 ring-brand-ink/5">
        <View className="px-4">
          <SheetRow icon="calendar-outline" label="Cycle settings" description="Length, reveal day, delays" onPress={() => parentNav?.navigate('CycleSettings')} />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow icon="notifications-outline" label="Notifications" description="Nudges, reminders, alerts" onPress={() => parentNav?.navigate('Notifications')} />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow icon="medkit-outline" label="Therapist access" description="Read-only summaries only" onPress={() => parentNav?.navigate('Therapist')} />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow icon="shield-outline" label="Safety & support" description="Pause the cycle, resources" onPress={() => parentNav?.navigate('Safety')} />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow icon="diamond-outline" label="Upgrade to Bonded" description="Deeper insights & reports" onPress={() => parentNav?.navigate('Bonded')} />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow
            icon="cloud-download-outline"
            label={isCheckingUpdate ? 'Checking…' : 'Check for updates'}
            description={Updates.channel ? `Channel: ${Updates.channel}` : 'Development build'}
            onPress={handleCheckForUpdate}
            showChevron={false}
          />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow
            icon="server-outline"
            label="API endpoint"
            description={API_BASE_URL}
            onPress={handleCopyApiUrl}
            showChevron={false}
          />
        </View>
      </View>

      <Text className="mb-2 mt-6 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">Legal</Text>
      <View className="mb-2 rounded-2xl bg-white ring-1 ring-brand-ink/5">
        <View className="px-4">
          <SheetRow icon="document-text-outline" label="Privacy policy" onPress={() => Linking.openURL(`${PUBLIC_API_BASE_URL}/legal/privacy`)} />
          <View className="h-px bg-brand-ink/5" />
          <SheetRow icon="document-outline" label="Terms of service" onPress={() => Linking.openURL(`${PUBLIC_API_BASE_URL}/legal/terms`)} />
        </View>
      </View>

      <View className="mt-6">
        <Button label="Log out" variant="ghost" onPress={() => logout()} />
      </View>

      <Text className="mb-2 mt-8 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-type-rant">Danger zone</Text>
      <View className="mb-2 rounded-2xl bg-white ring-1 ring-type-rant/20">
        <View className="px-4">
          <SheetRow icon="trash-outline" label="Delete account" onPress={() => parentNav?.navigate('DeleteAccount')} />
        </View>
      </View>

      <Text className="mb-4 mt-6 text-center text-[9px] font-sans-semibold uppercase tracking-[0.2em] text-brand-ink/30">
        Built with intention
      </Text>
    </Screen>
  );
}
