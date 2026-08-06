import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Colors } from "@/common/constants/colors";

export default function AttendanceLayout() {
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();

  // Plenty of schools still take attendance on paper. The API refuses these
  // routes for them, but the app had no guard at all — so a deep link from a
  // push, or a shortcut saved before the module was switched off, landed on a
  // screen built out of 403s. Mirror transport/hostel: bounce to home.
  useEffect(() => {
    if (!isFeatureEnabled("attendance")) {
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
