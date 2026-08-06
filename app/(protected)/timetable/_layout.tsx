import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Colors } from "@/common/constants/colors";

export default function TimetableLayout() {
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();

  // The drawer entry was flag-gated but the route was not, so a deep link or a
  // saved shortcut could still land here at a school that builds its timetable
  // elsewhere. Mirror transport/hostel: bounce to home.
  useEffect(() => {
    if (!isFeatureEnabled("timetable")) {
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
