import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen, TopBar, EmptyState, SkeletonLoader } from '../../components';
import { useNotifications } from '../../hooks';
import { notificationService } from '../../services/notification.service';
import type { AppNotification } from '../../types';

function describeNotification(notification: AppNotification): string {
  const payload = notification.payload as { therapistEmail?: string };
  switch (notification.kind) {
    case 'reveal_ready': return 'Your cycle is ready to reveal.';
    case 'partner_drop': return 'Your partner dropped a new entry.';
    case 'reveal_completed': return 'The vault was unlocked — go take a look.';
    case 'talk_scheduled': return 'A talk was scheduled.';
    case 'safety_pause': return 'Your partner paused the pact.';
    case 'urgent_drop': return 'Your partner marked something urgent — make time to talk soon.';
    case 'reveal_delayed': return 'Your partner asked for more time before the reveal.';
    case 'partner_left': return 'Your partner left Pact. This pact has ended — your past revealed cycles are still here.';
    case 'therapist_granted':
      return payload.therapistEmail
        ? `Your partner gave ${payload.therapistEmail} read-only access to your relationship summaries. You can revoke this anytime in Settings.`
        : 'Your partner granted therapist access to your relationship summaries.';
    case 'therapist_revoked':
      return payload.therapistEmail
        ? `Therapist access for ${payload.therapistEmail} was revoked.`
        : 'Therapist access was revoked.';
    default: return notification.kind;
  }
}

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const isUnread = !notification.readAt;
  return (
    <Pressable onPress={onPress} className="min-h-11 flex-row items-start gap-3 border-b border-brand-ink/5 py-4">
      <View className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: isUnread ? '#C36341' : 'transparent' }} />
      <View className="flex-1">
        <Text className="text-[14px]" style={{ color: isUnread ? '#1E1E1E' : 'rgba(30,30,30,0.5)' }}>
          {describeNotification(notification)}
        </Text>
        <Text className="mt-1 text-[11px] text-brand-ink/30">
          {new Date(notification.createdAt).toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}

export function NotificationsScreen() {
  const { data: notifications, isLoading, refetch } = useNotifications();

  const handlePress = async (notification: AppNotification) => {
    if (notification.readAt) return;
    await notificationService.markRead(notification._id);
    refetch();
  };

  return (
    <Screen>
      <TopBar title="Notifications" showBack />
      {isLoading && (
        <>
          <SkeletonLoader height={60} className="mb-3" />
          <SkeletonLoader height={60} className="mb-3" />
        </>
      )}
      {!isLoading && notifications?.length === 0 && (
        <EmptyState icon="notifications-outline" title="Nothing yet" description="Nudges and partner activity will show up here." />
      )}
      {notifications?.map((notification) => (
        <NotificationRow key={notification._id} notification={notification} onPress={() => handlePress(notification)} />
      ))}
    </Screen>
  );
}
