import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { checkAndFetchUpdateInBackground } from "@/common/utils/checkForAppUpdate";
import { initI18n } from "@/i18n";

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    // SF Pro fonts - using system fonts as fallback
    // If you have SF Pro font files, add them here:
    // 'SF-Pro-Display-Regular': require('@/assets/fonts/SF-Pro-Display-Regular.otf'),
    // 'SF-Pro-Display-Medium': require('@/assets/fonts/SF-Pro-Display-Medium.otf'),
    // 'SF-Pro-Display-Semibold': require('@/assets/fonts/SF-Pro-Display-Semibold.otf'),
    // 'SF-Pro-Display-Bold': require('@/assets/fonts/SF-Pro-Display-Bold.otf'),
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
