import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Screen, TopBar, EmptyState, SkeletonLoader } from '../../components';
import { useNotifications } from '../../hooks';
import { notificationService } from '../../services/notification.service';
import type { AppNotification, NotificationKind } from '../../types';

const KIND_COPY: Record<NotificationKind, string> = {
  reveal_ready: 'Your cycle is ready to reveal.',
  partner_drop: 'Your partner dropped a new entry.',
  reveal_completed: 'The vault was unlocked — go take a look.',
  talk_scheduled: 'A talk was scheduled.',
  safety_pause: 'Your partner paused the pact.',
  urgent_drop: 'Your partner marked something urgent — make time to talk soon.',
  reveal_delayed: 'Your partner asked for more time before the reveal.',
};

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const isUnread = !notification.readAt;
  return (
    <Pressable onPress={onPress} className="min-h-11 flex-row items-start gap-3 border-b border-brand-ink/5 py-4">
      <View className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: isUnread ? '#C36341' : 'transparent' }} />
      <View className="flex-1">
        <Text className="text-[14px]" style={{ color: isUnread ? '#1E1E1E' : 'rgba(30,30,30,0.5)' }}>
          {KIND_COPY[notification.kind] ?? notification.kind}
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
