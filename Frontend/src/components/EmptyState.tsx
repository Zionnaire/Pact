import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  /** When set, shows a small real photo instead of the icon — reserve for a handful of key-moment empty states. */
  imageUrl?: string;
}

export function EmptyState({ icon, title, description, imageUrl }: EmptyStateProps) {
  return (
    <View className="items-center px-6 py-16">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: 88, height: 88, borderRadius: 44 }} resizeMode="cover" />
      ) : (
        <Ionicons name={icon} size={32} color="rgba(30,30,30,0.3)" />
      )}
      <Text className="mt-4 text-center font-serif text-lg text-brand-ink">{title}</Text>
      {description && <Text className="mt-2 text-center text-sm text-brand-ink/50">{description}</Text>}
    </View>
  );
}
