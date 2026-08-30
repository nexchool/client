/**
 * UI “primary role” labels derived from raw JWT permissions.
 * For authorization use hasPermission / Protected — not this module.
 */
import * as PERMS from "@/modules/permissions/constants/permissions";

export const UI_ROLE = {
  ADMIN: "Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
} as const;

export type UiRole = (typeof UI_ROLE)[keyof typeof UI_ROLE];

/**
 * Single derived role for adaptive copy (mutually exclusive by priority).
 *
 * **There is deliberately no Parent role here.** A household shares one
 * credential — the student's — and sees the student experience (ADR-011). That
 * is the product default, not a gap: the server's Parent profile grants the
 * same self-scoped keys the Student profile does, so a parent signing in with
 * the family credential is already served the right screens.
 *
 * A branch returning `Parent` used to sit below Teacher, keyed on `fee.pay` and
 * `fee.read.child`. **Neither permission exists on the server**, so it could
 * never be reached — it only made the shared-credential model look broken.
 *
 * When a school asks for separate parent logins, that becomes a per-tenant
 * setting turned on from the super-admin panel, and this is the function that
 * learns about it: add the role back here, keyed on whatever the server then
 * grants a parent that a student does not have. Adding it before that point
 * would route a parent to screens resolving the *caller's own* student record,
 * which a separate parent account does not have.
 */
export function resolveUiRole(permissions: string[]): UiRole {
  if (
    permissions.includes(PERMS.SYSTEM_MANAGE) ||
    permissions.includes(PERMS.USER_MANAGE) ||
    permissions.includes(PERMS.ROLE_MANAGE)
  ) {
    return UI_ROLE.ADMIN;
  }
  if (
    permissions.includes(PERMS.ATTENDANCE_MARK) ||
    permissions.includes(PERMS.GRADE_CREATE)
  ) {
    return UI_ROLE.TEACHER;
  }
  return UI_ROLE.STUDENT;
}
