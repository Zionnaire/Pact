import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  avatarUrl?: string;
  avatarInitial: string;
  size?: number;
}

export function Avatar({ avatarUrl, avatarInitial, size = 40 }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={dimensionStyle} accessibilityLabel="Avatar" />;
  }

  return (
    <View style={dimensionStyle} className="items-center justify-center bg-brand-plum">
      <Text className="font-serif text-brand-gold" style={{ fontSize: size * 0.4 }}>
        {avatarInitial}
      </Text>
    </View>
  );
}
