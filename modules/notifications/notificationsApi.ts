import { apiGet, apiPatch, apiPost } from "@/common/services/api";
import type { AppNotification, NotificationsListResponse } from "./types";

const base = "/api/notifications";

export async function fetchNotifications(params: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AppNotification[]> {
  const q = new URLSearchParams();
  if (params.unreadOnly) q.set("unread_only", "true");
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.offset != null) q.set("offset", String(params.offset));
  const qs = q.toString();
  const path = qs ? `${base}?${qs}` : base;
  const data = await apiGet<NotificationsListResponse>(path);
  return data.notifications ?? [];
}

export function markNotificationRead(notificationId: string): Promise<AppNotification> {
  return apiPatch<AppNotification>(`${base}/${encodeURIComponent(notificationId)}/read`);
}

export function markAllNotificationsRead(): Promise<{ updated_count?: number }> {
  return apiPost<{ updated_count?: number }>(`${base}/mark-all-read`);
}
