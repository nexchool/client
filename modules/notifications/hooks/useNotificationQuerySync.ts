import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

const NOTIFICATIONS_QK = ["notifications"] as const;

/**
 * Keep list + header badge fresh: foreground push, app resume, and after handling taps elsewhere.
 */
export function useNotificationQuerySync(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QK] });
    };

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      invalidate();
    });

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        invalidate();
      }
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      receivedSub.remove();
      appSub.remove();
    };
  }, [enabled, queryClient]);
}

export function invalidateNotificationQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QK] });
}
