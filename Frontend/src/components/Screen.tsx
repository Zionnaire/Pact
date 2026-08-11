import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from './AmbientBackground';
import { useResponsive, MAX_CONTENT_WIDTH } from '../utils/responsive';

interface ScreenProps {
  scroll?: boolean;
  className?: string;
  ambient?: boolean;
  children: React.ReactNode;
}

/**
 * Page gutter + safe-area wrapper every screen uses — see Pact_Design_System.md §3.
 * On tablets (iOS supportsTablet, large Android), content is capped to a
 * phone-shaped column and centered rather than stretching edge-to-edge.
 */
export function Screen({ scroll = true, className, ambient = false, children }: ScreenProps) {
  const { isTablet, gutter } = useResponsive();
  const innerStyle = isTablet ? { width: '100%' as const, maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const } : undefined;

  return (
    <SafeAreaView className="flex-1 bg-brand-paper" edges={['top', 'left', 'right']}>
      {ambient && <AmbientBackground />}
      {scroll ? (
        <ScrollView
          className={className}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32 }}
        >
          <View style={innerStyle}>{children}</View>
        </ScrollView>
      ) : (
        <View className={className} style={{ flex: 1, paddingHorizontal: gutter }}>
          {isTablet ? <View style={[{ flex: 1 }, innerStyle]}>{children}</View> : children}
        </View>
      )}
    </SafeAreaView>
  );
}
