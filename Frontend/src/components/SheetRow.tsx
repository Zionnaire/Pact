import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SheetRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

/** Icon chip + label/description + chevron — Pact_Design_System.md §4. */
export function SheetRow({ icon, label, description, onPress, showChevron = true }: SheetRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      className="min-h-11 flex-row items-center gap-3 py-3"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-plum/5">
        <Ionicons name={icon} size={18} color="#5B1F24" />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] text-brand-ink">{label}</Text>
        {description && <Text className="text-[12px] text-brand-ink/50">{description}</Text>}
      </View>
      {showChevron && onPress && <Ionicons name="chevron-forward" size={18} color="rgba(30,30,30,0.3)" />}
    </Pressable>
  );
}
