/**
 * Canonical student lifecycle statuses.
 *
 * Values are the lowercase strings the server persists and filters on — keep
 * this list in step with `STUDENT_STATUS_VALUES` in
 * `server/modules/students/student_schemas.py` and with admin-web's
 * `src/constants/studentStatus.ts`.
 *
 * All eight belong here because the list filter matches one exactly: offering
 * a subset does not merely hide the rest, it makes those students reachable
 * only by clearing the filter entirely. The mobile filter used to offer three,
 * so a student who had been withdrawn, graduated, transferred, suspended,
 * flagged as leaving, or recorded as dropped out answered to neither "Active"
 * nor "Inactive".
 */
export const STUDENT_STATUS_VALUES = [
  'active',
  'inactive',
  // Flagged to leave at the end of the year — still here, still taught, and
  // excluded from promotion. Past tense is `withdrawn`, which is an action.
  'leaving',
  'suspended',
  'dropped_out',
  'withdrawn',
  'graduated',
  'transferred',
] as const;

export type StudentStatus = (typeof STUDENT_STATUS_VALUES)[number];

/** i18n key for a status, under the `students` namespace. */
export function studentStatusKey(value: StudentStatus | string): string {
  return `status.${value}`;
}
