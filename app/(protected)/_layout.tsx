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
  const { isAuthenticated, isLoading, mustResetPassword, tenantKnown } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Same choice as `app/index.tsx`'s signed-out redirect, and for the same
    // reason: sending a tenant-less phone straight to `login` is the
    // unbranded, method-blind screen this app works to avoid. Sign-out no
    // longer clears tenant identity (see `clearAuth`), so this will normally
    // still be true here — but hardcoding `login` regardless of `tenantKnown`
    // is exactly the assumption that made the old sign-out bug invisible in
    // this file, so it is consulted rather than assumed, the same as every
    // other redirect in this app.
    if (!isAuthenticated) {
      router.replace(tenantKnown ? "/(auth)/login" : "/(auth)/select-school");
      return;
    }

    // A cold start restores a session from storage without asking the server,
    // so a flagged account otherwise lands here and every screen 403s. The
    // restored flag is checked before anything below mounts, and the profile
    // refresh that follows corrects it either way.
    if (mustResetPassword) {
      router.replace("/(auth)/set-password");
    }
  }, [isAuthenticated, isLoading, mustResetPassword, tenantKnown, router]);

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
