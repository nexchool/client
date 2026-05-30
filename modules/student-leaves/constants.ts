// client/modules/student-leaves/constants.ts
import type { SelectOption } from '@/common/forms';
import type { Palette } from '@/common/theme';
import type { LeaveStatus } from './types';

/**
 * Accent palette token per student-leave status — matches the
 * People/finance/announcements badge pattern (colored text on a soft surface).
 * pending* = warning, approved = success, rejected = error,
 * cancelled = onSurfaceVariant (muted).
 */
export const STATUS_ACCENT: Record<LeaveStatus, keyof Palette> = {
  pending_class_teacher: 'warning',
  pending_admin: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'onSurfaceVariant',
};

export function statusAccent(status: LeaveStatus): keyof Palette {
  return STATUS_ACCENT[status] ?? 'onSurfaceVariant';
}

export const LEAVE_TYPES = ['sick', 'medical', 'family', 'religious', 'other'] as const;
export type LeaveTypeLiteral = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'sick', label: 'Sick' },
  { value: 'medical', label: 'Medical' },
  { value: 'family', label: 'Family' },
  { value: 'religious', label: 'Religious' },
  { value: 'other', label: 'Other' },
];

export const HALF_DAY_OPTIONS: SelectOption[] = [
  { value: 'full', label: 'Full day' },
  { value: 'am', label: 'Morning' },
  { value: 'pm', label: 'Afternoon' },
];
