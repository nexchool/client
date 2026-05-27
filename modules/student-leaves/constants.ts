// client/modules/student-leaves/constants.ts
import type { SelectOption } from '@/common/forms';

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
