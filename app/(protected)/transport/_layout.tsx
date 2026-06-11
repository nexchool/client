import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Colors } from "@/common/constants/colors";

export default function TransportLayout() {
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();

  // The drawer entry is flag-gated but the routes were not, so a deep link
  // (notification, stale shortcut) could land here with the feature disabled
  // and surface raw 403s. Mirror finance/_layout: bounce to home instead.
  useEffect(() => {
    if (!isFeatureEnabled("transport")) {
      router.replace("/(protected)/home");
    }
  }, [isFeatureEnabled, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
