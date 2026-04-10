/**
 * Notification row from GET /api/notifications (merged legacy + bulk recipient state).
 */
export interface AppNotification {
  id: string;
  user_id: string | null;
  type: string;
  channel: string;
  title: string;
  body: string | null;
  read_at: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string | null;
  recipient_id?: string;
  recipient_status?: string;
}

export interface NotificationsListResponse {
  notifications: AppNotification[];
}
