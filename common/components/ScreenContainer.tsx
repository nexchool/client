import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/common/theme';

type Props = {
  children: ReactNode;
  /** Wrap content in a ScrollView. Default true. */
  scrollable?: boolean;
  /** Extra offset for the keyboard avoiding view (e.g. header height). */
  keyboardOffset?: number;
  /** Disable horizontal margins (full-bleed). Default false. */
  noHorizontalPadding?: boolean;
};

export function ScreenContainer({
  children,
  scrollable = true,
  keyboardOffset = 0,
  noHorizontalPadding = false,
}: Props) {
  const { palette, spacing, mode } = useTheme();

  const horizontalPadding = noHorizontalPadding ? 0 : spacing.marginMobile;

  const inner = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: horizontalPadding },
      ]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, { paddingHorizontal: horizontalPadding }]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.surface }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        {inner}
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
