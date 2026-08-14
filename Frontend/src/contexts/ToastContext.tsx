import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { colors } from '../theme/tokens';

type ToastKind = 'error' | 'success' | 'info';

interface ToastState {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  showToast: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const KIND_STYLE: Record<ToastKind, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  error: { bg: colors.typeRant, icon: 'alert-circle' },
  success: { bg: colors.typeNote, icon: 'checkmark-circle' },
  info: { bg: colors.brandPlum, icon: 'information-circle' },
};

const AUTO_DISMISS_MS = 4500;

/**
 * Global toast host, imperatively triggerable from outside React (see
 * showGlobalToast) — api.ts's axios interceptor has no component tree to
 * read context from, so it needs a plain function it can call directly.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const insets = useSafeAreaInsets();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    nextId.current += 1;
    setToast({ id: nextId.current, kind, message });
    dismissTimer.current = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
  }, []);

  useEffect(() => {
    registerGlobalToastHandler(showToast);
    return () => registerGlobalToastHandler(null);
  }, [showToast]);

  const style = toast ? KIND_STYLE[toast.kind] : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && style && (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(300).springify().damping(16)}
          exiting={FadeOutUp.duration(200)}
          style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 999 }}
        >
          <Pressable
            onPress={() => setToast(null)}
            accessibilityRole="alert"
            accessibilityLabel={toast.message}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: style.bg,
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 16,
              shadowColor: '#1E1E1E',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            <Ionicons name={style.icon} size={18} color="#F9F7F2" />
            <Text style={{ flex: 1, color: '#F9F7F2', fontSize: 13 }}>{toast.message}</Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ── Imperative escape hatch for non-component code (axios interceptors) ──
let globalShowToast: ((kind: ToastKind, message: string) => void) | null = null;

function registerGlobalToastHandler(handler: typeof globalShowToast): void {
  globalShowToast = handler;
}

export function showGlobalToast(kind: ToastKind, message: string): void {
  globalShowToast?.(kind, message);
}
