// client/modules/notifications/utils/notificationGrouping.ts
import type { AppNotification } from '../types';
import { addDaysIso, schoolTodayIso, toSchoolDateIso } from '@/common/utils/datetime';

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

/**
 * Bucket notifications into Today / Yesterday / Earlier by created_at. Empty
 * buckets omitted.
 *
 * "Today" is the school's day, so the buckets are decided by comparing
 * calendar dates in the school's zone rather than by a midnight taken from
 * the phone's clock — a phone set to another zone drew the line in the wrong
 * place, and "Yesterday" was whatever that zone thought yesterday was.
 */
export function bucketByDate(
  items: AppNotification[],
  todayIso: string = schoolTodayIso(),
): NotificationSection[] {
  const yesterdayIso = addDaysIso(todayIso, -1);
  const buckets: Record<DateBucketKey, AppNotification[]> = { today: [], yesterday: [], earlier: [] };
  for (const n of items) {
    const day = toSchoolDateIso(n.created_at) ?? '';
    if (day === todayIso) buckets.today.push(n);
    else if (day === yesterdayIso) buckets.yesterday.push(n);
    else buckets.earlier.push(n);
  }
  return (['today', 'yesterday', 'earlier'] as DateBucketKey[])
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, data: buckets[k] }));
}
