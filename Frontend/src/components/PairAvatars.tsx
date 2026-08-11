import React from 'react';
import { View } from 'react-native';
import { Avatar } from './Avatar';
import type { User } from '../types';

interface PairAvatarsProps {
  self: User;
  partner: User | null;
  size?: number;
}

/** Overlapping avatar pair used in every main-screen header. */
export function PairAvatars({ self, partner, size = 32 }: PairAvatarsProps) {
  return (
    <View className="flex-row items-center">
      <Avatar avatarUrl={self.avatarUrl} avatarInitial={self.avatarInitial} size={size} />
      {partner && (
        <View style={{ marginLeft: -size * 0.35 }}>
          <View style={{ borderWidth: 2, borderColor: '#F9F7F2', borderRadius: size / 2 }}>
            <Avatar avatarUrl={partner.avatarUrl} avatarInitial={partner.avatarInitial} size={size} />
          </View>
        </View>
      )}
    </View>
  );
}
