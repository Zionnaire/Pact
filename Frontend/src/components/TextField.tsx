import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, ...rest }: TextFieldProps) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-1.5 text-[10px] font-sans-semibold uppercase tracking-[0.3em] text-brand-clay">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="rgba(30,30,30,0.3)"
        accessibilityLabel={label}
        className="min-h-11 rounded-2xl border border-brand-ink/10 bg-white px-4 py-3 text-[15px] text-brand-ink"
        {...rest}
      />
      {error && <Text className="mt-1 text-[12px] text-type-rant">{error}</Text>}
    </View>
  );
}
