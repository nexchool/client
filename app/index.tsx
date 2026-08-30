import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Colors } from "@/common/constants/colors";

export default function Index() {
  const { isAuthenticated, isLoading, mustResetPassword } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProtectedGroup = segments[0] === "(protected)";

    if (!isAuthenticated) {
      if (!inAuthGroup) router.replace("/(auth)/login");
      return;
    }

    // Signed in, but holding a password the school issued: the only screen the
    // server will serve is the one that replaces it. Sending them home instead
    // would open an app in which nothing loads.
    if (mustResetPassword) {
      if (!inAuthGroup) router.replace("/(auth)/set-password");
      return;
    }

    if (!inProtectedGroup) {
      router.replace("/(protected)/home");
    }
  }, [isAuthenticated, isLoading, mustResetPassword, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
