import { useMemo } from "react";
import { UI_ROLE, resolveUiRole } from "@/common/constants/uiRoles";
import { usePermissions } from "./usePermissions";

export type { UiRole } from "@/common/constants/uiRoles";

/**
 * Single derived “primary” role for adaptive UI (headings, one-of labels).
 *
 * Uses the raw permission list from the token — not `hasPermission()`, which treats
 * `system.manage` as satisfying every check and is meant for authorization gates.
 *
 * For access control, keep using `Protected`, `hasPermission`, and `hasAnyPermission`.
 */
export function useUiRole() {
  const { permissions } = usePermissions();

  return useMemo(() => {
    const role = resolveUiRole(permissions ?? []);
    return {
      role,
      isAdmin: role === UI_ROLE.ADMIN,
      isTeacher: role === UI_ROLE.TEACHER,
      isStudent: role === UI_ROLE.STUDENT,
      isParent: role === UI_ROLE.PARENT,
    };
  }, [permissions]);
}

export { UI_ROLE } from "@/common/constants/uiRoles";
