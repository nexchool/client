import type { SelectOption } from '@/common/forms';
import type { AudienceRole } from './types';

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
