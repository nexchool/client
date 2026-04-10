import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { normalizePushData, navigateFromPushData } from "../pushNavigation";
import { canOpenFinanceDeepLinks } from "../financeDeepLinkAccess";
import { invalidateNotificationQueries } from "./useNotificationQuerySync";

let coldStartResponseChecked = false;

/**
 * When user taps a push (foreground, background, or cold start), open the target screen.
 */
export function useNotificationResponseNavigation(enabled: boolean) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isFeatureEnabled, hasAnyPermission } = useAuth();
  const lastHandledKey = useRef<string | null>(null);
  const authRef = useRef({ isFeatureEnabled, hasAnyPermission });
  authRef.current = { isFeatureEnabled, hasAnyPermission };

  useEffect(() => {
    if (!enabled) return;

    const handle = (response: Notifications.NotificationResponse) => {
      const data = normalizePushData(
        response.notification.request.content.data as Record<string, unknown>
      );
      const dedupeKey = [
        data.notification_id || "",
        response.actionIdentifier || "default",
        response.notification.date,
      ].join("|");
      if (dedupeKey === lastHandledKey.current) return;
      lastHandledKey.current = dedupeKey;
      const { isFeatureEnabled: feat, hasAnyPermission: anyPerm } = authRef.current;
      const canFinance = canOpenFinanceDeepLinks(feat, anyPerm);
      navigateFromPushData(router, data, canFinance);
      invalidateNotificationQueries(queryClient);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handle);

    if (!coldStartResponseChecked) {
      coldStartResponseChecked = true;
      void Notifications.getLastNotificationResponseAsync().then((last) => {
        if (last) handle(last);
      });
    }

    return () => sub.remove();
  }, [enabled, queryClient, router]);
}
