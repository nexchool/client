export interface AuditSelectOption {
  value: string;
  label: string;
}

// value '' => "All" => param omitted from the request
export const MODULE_OPTIONS: AuditSelectOption[] = [
  { value: '', label: 'All' },
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'classes', label: 'Classes' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'fees', label: 'Fees' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'holidays', label: 'Holidays' },
  { value: 'schedule', label: 'Schedule' },
];

export const ACTION_OPTIONS: AuditSelectOption[] = [
  { value: '', label: 'All' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
