import React, { useState, type ReactNode } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentMaxWidth, useTheme } from '@/common/theme';
import { AppHeader } from './AppHeader';
import { AppDrawer } from './AppDrawer';
import { BottomTabBar } from './BottomTabBar';

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const { palette, mode } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: palette.surface }]}
    >
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={palette.surface}
      />
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      {/*
        The one place every signed-in screen passes through, which is why the
        content cap lives here: a hundred and nineteen screens get a tablet
        layout without any of them being edited, and none of them can forget.

        Only the column is capped. The header and tab bar stay full width on
        purpose — chrome belongs to the device, content belongs to the reader.
        On any phone the cap never binds and this changes nothing.
      */}
      <View style={styles.contentOuter}>
        <View style={styles.content}>{children}</View>
      </View>
      <BottomTabBar />
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  contentOuter: { flex: 1, alignItems: 'center' },
  content: { flex: 1, width: '100%', maxWidth: ContentMaxWidth },
});
