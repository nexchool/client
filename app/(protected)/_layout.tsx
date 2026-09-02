import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import MainLayout from "@/common/components/MainLayout";
import { AcademicYearProvider } from "@/modules/academics/context/AcademicYearContext";
import { useNotificationResponseNavigation } from "@/modules/notifications/hooks/useNotificationResponseNavigation";
import { useNotificationQuerySync } from "@/modules/notifications/hooks/useNotificationQuerySync";

function NotificationResponseBridge() {
  const { isFeatureEnabled } = useAuth();
  const syncNotifications = isFeatureEnabled("notifications");

  useNotificationQuerySync(syncNotifications);
  useNotificationResponseNavigation(true);
  return null;
}

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading, mustResetPassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    // A cold start restores a session from storage without asking the server,
    // so a flagged account otherwise lands here and every screen 403s. The
    // restored flag is checked before anything below mounts, and the profile
    // refresh that follows corrects it either way.
    if (mustResetPassword) {
      router.replace("/(auth)/set-password");
    }
  }, [isAuthenticated, isLoading, mustResetPassword, router]);

  if (isLoading || !isAuthenticated || mustResetPassword) {
    return null;
  }

  return (
    <AcademicYearProvider>
      <NotificationResponseBridge />
      <MainLayout />
    </AcademicYearProvider>
  );
}
