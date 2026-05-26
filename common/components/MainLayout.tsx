import React from 'react';
import { Slot } from 'expo-router';
import { AppShell } from '@/common/components/chrome';

/**
 * MainLayout — thin wrapper composing the app chrome around the current route.
 * The previous header/sidebar/year-picker logic now lives in chrome/AppShell.
 */
export default function MainLayout() {
  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
