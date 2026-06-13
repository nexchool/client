import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/common/theme';

type Props = {
  children: ReactNode;
  /** Wrap content in a ScrollView. Default true. */
  scrollable?: boolean;
  /** Extra offset for the keyboard avoiding view (e.g. header height). */
  keyboardOffset?: number;
  /** Disable horizontal margins (full-bleed). Default false. */
  noHorizontalPadding?: boolean;
  /**
   * Apply the top safe-area inset. Default true (correct for standalone
   * `(auth)/*` screens). Set false for PROTECTED screens rendered inside
   * AppShell — AppHeader already owns the top inset, so a second one here
   * produces a phantom top gap. With it off we still keep the
   * KeyboardAvoidingView + ScrollView this container provides.
   */
  topInset?: boolean;
  /**
   * Pinned action bar rendered BELOW the scroll area (in layout, not
   * absolutely positioned) — replaces the per-screen absolute footer +
   * hand-tuned ScrollView paddingBottom pattern.
   */
  footer?: ReactNode;
  /** Vertical gap between top-level children (design rhythm: spacing.lg). */
  contentGap?: number;
};

export function ScreenContainer({
  children,
  scrollable = true,
  keyboardOffset = 0,
  noHorizontalPadding = false,
  topInset = true,
  footer,
  contentGap,
}: Props) {
  const { palette, spacing, mode } = useTheme();

  const horizontalPadding = noHorizontalPadding ? 0 : spacing.marginMobile;
  const edges: Edge[] = topInset
    ? ['top', 'left', 'right', 'bottom']
    : ['left', 'right', 'bottom'];

  const inner = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingHorizontal: horizontalPadding,
          ...(contentGap != null ? { gap: contentGap } : null),
          // Breathing room above an in-layout footer (or the screen bottom).
          paddingBottom: footer ? spacing.md : 0,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.staticContent,
        {
          paddingHorizontal: horizontalPadding,
          ...(contentGap != null ? { gap: contentGap } : null),
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: palette.surface }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        {inner}
        {footer ? (
          <View
            style={{
              paddingHorizontal: horizontalPadding,
              paddingVertical: spacing.md,
              borderTopWidth: 1,
              borderTopColor: palette.surfaceContainerHigh,
              backgroundColor: palette.surface,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  staticContent: { flex: 1 },
});
