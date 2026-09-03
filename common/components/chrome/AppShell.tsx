import React, { useState, type ReactNode } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentMaxWidth, useTheme } from '@/common/theme';
import { AppHeader } from './AppHeader';
import { AppDrawer } from './AppDrawer';
import { BottomTabBar } from './BottomTabBar';
import { AcademicYearSheet } from './AcademicYearSheet';

type Props = {
  children: ReactNode;
};

/**
 * Screens that are a canvas rather than a column, and so get the whole screen.
 *
 * Most screens read better narrow — a form or a list has a comfortable width
 * and stretching it past that helps nobody. A timetable is the opposite: it has
 * an intrinsic width, one column per school day, and the reason to open it on a
 * tablet is to see the whole week at once.
 *
 * The weekly grid is 56pt of time labels plus 140pt per day: 756pt for a
 * five-day week, 896pt for the Monday-to-Saturday week most of these schools
 * run. Capped at 720 even a five-day week scrolls sideways on a 13" iPad,
 * which is worse than what it replaced.
 *
 * A route list rather than a context flag, because pathname is known during
 * render — a screen announcing itself in an effect would paint one frame narrow
 * and then jump.
 */
const FULL_WIDTH_ROUTES = ['/timetable'];

function isFullWidthRoute(pathname: string): boolean {
  return FULL_WIDTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function AppShell({ children }: Props) {
  const { palette, mode } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The year picker lives in the drawer but is rendered here, as the drawer's
  // sibling rather than its child: both are Modals, and on Android a Modal
  // inside a Modal is its own window on top of another window — a stack that
  // has already cost this app one unresponsive-UI bug.
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const pathname = usePathname();
  const fullWidth = isFullWidthRoute(pathname);

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
        <View style={[styles.content, fullWidth && styles.contentFullWidth]}>
          {children}
        </View>
      </View>
      <BottomTabBar />
      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenYearPicker={() => setYearPickerOpen(true)}
      />
      <AcademicYearSheet
        visible={yearPickerOpen}
        onClose={() => setYearPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  contentOuter: { flex: 1, alignItems: 'center' },
  content: { flex: 1, width: '100%', maxWidth: ContentMaxWidth },
  contentFullWidth: { maxWidth: undefined },
});
