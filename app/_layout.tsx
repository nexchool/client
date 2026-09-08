import { Stack } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuthContext } from "@/modules/auth/context/AuthContext";
import { LockScreen } from "@/modules/auth/components/LockScreen";
import { seedBakedTenant } from "@/modules/auth/bootstrap/seedBakedTenant";
import { checkAndFetchUpdateInBackground } from "@/common/utils/checkForAppUpdate";
import { initI18n } from "@/i18n";
import { ThemeProvider } from "@/common/theme";
import { ErrorBoundary } from "@/common/components/ErrorBoundary";
import { FeedbackProvider } from "@/common/feedback";
import { useTenantTheme } from "@/modules/branding/useTenantTheme";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  // Whether `seedBakedTenant` has run. Gates mounting `RootLayoutReady` below
  // — not just a background task — because that is where `useTenantTheme`
  // lives, and its first read of the tenant must not race the seed write.
  // See `seedBakedTenant.ts` for what "the tenant" means here and why a
  // signed-in session's tenant is never overwritten by it.
  const [tenantSeeded, setTenantSeeded] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    void initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    // `tenantSeeded` gates both hiding the splash screen and mounting
    // `RootLayoutReady` — which is where `ErrorBoundary` lives. An unhandled
    // rejection here would therefore leave the splash up forever with
    // nothing mounted to catch it: not a broken screen, a bricked app until
    // reinstall. `SecureStore` can genuinely reject in production (a
    // corrupted Android keystore, a restore onto a different device, an
    // OS-level decrypt failure), so a seeding failure degrades to
    // "unseeded" — the tree mounts, `getBakedTenant`/`getTenantId` reads
    // downstream see no tenant, and a baked build falls back to the same
    // `select-school` flow a general build already needs to handle — rather
    // than blocking everything below the splash.
    void seedBakedTenant()
      .catch((error) => {
        console.error("seedBakedTenant failed; continuing unseeded", error);
      })
      .then(() => setTenantSeeded(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nReady && tenantSeeded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nReady, tenantSeeded]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    if (!i18nReady) return;
    void checkAndFetchUpdateInBackground();
  }, [fontsLoaded, fontError, i18nReady]);

  if ((!fontsLoaded && !fontError) || !i18nReady || !tenantSeeded) {
    return null;
  }

  return <RootLayoutReady />;
}

/**
 * The biometric gate, above the router rather than inside any one group.
 *
 * It started life in `(protected)/_layout.tsx`, which was wrong in a way worth
 * recording. A forced password change redirects to `(auth)/set-password` —
 * *outside* the protected group — so the gate there was simply never rendered
 * for an account in that state. And `set-password` takes only a new password:
 * "the caller is already signed in, and the session itself is the credential"
 * (`useForceResetPassword`). So an admin resetting somebody's password turned
 * their locked phone into an unlocked one: whoever held it could set a new
 * password and walk in, having passed no biometric prompt at all.
 *
 * A gate that only covers some routes is not a gate. This one sits above the
 * `Stack`, so every route — signed-in, forced-reset, deep-linked from a
 * notification — is behind it.
 *
 * It cannot strand anybody signed out: `isLocked` is only ever raised for a
 * session actually restored from storage, so the sign-in screens are never
 * behind it, and "sign in with your password instead" clears the session,
 * which lowers the gate on its way out.
 */
function SessionGate({ children }: { children: ReactNode }) {
  const { isLocked } = useAuthContext();
  if (!isLocked) return <>{children}</>;

  // `SafeAreaProvider` only for this branch. Every other screen in the app
  // renders inside the `Stack`, and React Navigation puts a provider there —
  // this is the one screen that renders with the `Stack` unmounted, so it is
  // the one screen that would be relying on a context nothing else supplies.
  // Nesting providers is supported, so this costs nothing if one already
  // exists; leaving it out would make the lock screen the only place in the
  // app whose insets depend on an implementation detail of the router.
  return (
    <SafeAreaProvider>
      <LockScreen />
    </SafeAreaProvider>
  );
}

/**
 * Split out from `RootLayout` so `useTenantTheme` — and everything under
 * `AuthProvider` that reads the current tenant, starting with the login
 * screen's `usePublishedAuthMethods` — mounts only once `tenantSeeded` is
 * true. A baked build's tenant_id is in storage *before* this component
 * exists, not merely before this component happens to finish an async read,
 * which is what makes the very first paint branded instead of racing to be.
 */
function RootLayoutReady() {
  // Read from cache before the first paint, then corrected from the server.
  // The tenant is read from storage inside the hook, because this sits above
  // AuthProvider on purpose — see the ErrorBoundary note below.
  const { palette: tenantPalette } = useTenantTheme(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider mode="light" paletteOverride={tenantPalette}>
        {/*
          Inside ThemeProvider so the fallback is a Nexchool screen rather than
          unstyled text, and outside everything else so a throw in any provider
          or any screen is still caught. Fonts and i18n are already resolved by
          the guard above, so the fallback can use both.
        */}
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              {/*
                Inside AuthProvider so a dialog can be raised from anywhere a
                session exists, and above the Stack so its toast host sits over
                every screen rather than scrolling away with one.
              */}
              <FeedbackProvider>
                <SessionGate>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                  </Stack>
                </SessionGate>
              </FeedbackProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
