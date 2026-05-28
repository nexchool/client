// client/modules/notifications/utils/notificationGrouping.ts
import type { AppNotification } from '../types';

export type NotificationCategory = 'all' | 'announcements' | 'fees' | 'leaves' | 'system';

/** Map a raw notification `type` string to a UI category. Unknown types → 'system'. */
export function categoryOf(type: string | null | undefined): Exclude<NotificationCategory, 'all'> {
  const t = (type ?? '').toLowerCase();
  if (t.startsWith('announcement')) return 'announcements';
  if (t.includes('leave')) return 'leaves';           // student_leave.* + teacher.leave.*
  if (t.startsWith('fee') || t.includes('payment')) return 'fees';
  return 'system';
}

export function filterByCategory(
  items: AppNotification[],
  category: NotificationCategory,
): AppNotification[] {
  if (category === 'all') return items;
  return items.filter((n) => categoryOf(n.type) === category);
}

export type DateBucketKey = 'today' | 'yesterday' | 'earlier';

export interface NotificationSection {
  key: DateBucketKey;
  data: AppNotification[];
}

/** Bucket notifications into Today / Yesterday / Earlier by created_at. Empty buckets omitted. */
export function bucketByDate(
  items: AppNotification[],
  now: Date = new Date(),
): NotificationSection[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const buckets: Record<DateBucketKey, AppNotification[]> = { today: [], yesterday: [], earlier: [] };
  for (const n of items) {
    const ts = n.created_at ? new Date(n.created_at).getTime() : 0;
    if (ts >= startOfToday) buckets.today.push(n);
    else if (ts >= startOfYesterday) buckets.yesterday.push(n);
    else buckets.earlier.push(n);
  }
  return (['today', 'yesterday', 'earlier'] as DateBucketKey[])
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, data: buckets[k] }));
}
