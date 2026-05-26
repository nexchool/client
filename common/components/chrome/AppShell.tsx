import React, { useState, type ReactNode } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/common/theme';
import { AppHeader } from './AppHeader';
import { AppDrawer } from './AppDrawer';
import { BottomTabBar } from './BottomTabBar';

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const { palette } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: palette.surface }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <View style={styles.content}>{children}</View>
      <BottomTabBar />
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
});
