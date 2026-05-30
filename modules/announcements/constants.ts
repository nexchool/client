import type { SelectOption } from '@/common/forms';
import type { Palette } from '@/common/theme';
import type { AnnouncementStatus, AudienceRole } from './types';

export const AUDIENCE_SCOPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Whole school' },
  { value: 'roles', label: 'By role' },
  { value: 'classes', label: 'By class' },
  { value: 'students', label: 'Specific students' },
];

export const AUDIENCE_ROLE_OPTIONS: { value: AudienceRole; label: string }[] = [
  { value: 'admin', label: 'Admins' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'student', label: 'Students' },
  { value: 'parent', label: 'Parents' },
];

export const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Sent',
  recalled: 'Recalled',
};

/**
 * Accent palette token per announcement status — matches the People/finance
 * status-badge pattern (colored text on a soft surface container).
 */
export const STATUS_ACCENT: Record<AnnouncementStatus, keyof Palette> = {
  published: 'primary',
  scheduled: 'warning',
  recalled: 'error',
  draft: 'onSurfaceVariant',
};

export function statusAccent(status: string): keyof Palette {
  return STATUS_ACCENT[status as AnnouncementStatus] ?? 'onSurfaceVariant';
}
