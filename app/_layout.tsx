import { Stack } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { checkAndFetchUpdateInBackground } from "@/common/utils/checkForAppUpdate";
import { initI18n } from "@/i18n";
import { ThemeProvider } from "@/common/theme";
import { ErrorBoundary } from "@/common/components/ErrorBoundary";
import { FeedbackProvider } from "@/common/feedback";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

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
    if ((fontsLoaded || fontError) && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nReady]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    if (!i18nReady) return;
    void checkAndFetchUpdateInBackground();
  }, [fontsLoaded, fontError, i18nReady]);

  if ((!fontsLoaded && !fontError) || !i18nReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider mode="light">
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
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                </Stack>
              </FeedbackProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
