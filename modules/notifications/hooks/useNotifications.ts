import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../notificationsApi";

export const notificationsQueryKeys = {
  list: (unreadOnly: boolean) => ["notifications", "list", { unreadOnly }] as const,
  unreadBadge: ["notifications", "unread-badge"] as const,
};

const qk = notificationsQueryKeys;

export function useNotificationsList(unreadOnly = false) {
  return useQuery({
    queryKey: qk.list(unreadOnly),
    queryFn: () => fetchNotifications({ unreadOnly, limit: 100, offset: 0 }),
  });
}

/** Unread count for header badge (capped at 100; shows 99+ if at cap). */
export function useUnreadNotificationsBadge(enabled: boolean) {
  return useQuery({
    queryKey: qk.unreadBadge,
    queryFn: () => fetchNotifications({ unreadOnly: true, limit: 100, offset: 0 }),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
