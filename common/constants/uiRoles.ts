/**
 * UI “primary role” labels derived from raw JWT permissions.
 * For authorization use hasPermission / Protected — not this module.
 */
import * as PERMS from "@/modules/permissions/constants/permissions";

export const UI_ROLE = {
  ADMIN: "Admin",
  TEACHER: "Teacher",
  PARENT: "Parent",
  STUDENT: "Student",
} as const;

export type UiRole = (typeof UI_ROLE)[keyof typeof UI_ROLE];

/**
 * Single derived role for adaptive copy (mutually exclusive by priority).
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
  if (
    permissions.includes(PERMS.FEE_PAY) ||
    permissions.includes(PERMS.FEE_READ_CHILD)
  ) {
    return UI_ROLE.PARENT;
  }
  return UI_ROLE.STUDENT;
}
