import * as PERMS from "@/modules/permissions/constants/permissions";

/**
 * True when this user may open finance stack routes (same checks as finance/_layout).
 */
export function canOpenFinanceDeepLinks(
  isFeatureEnabled: (key: string) => boolean,
  hasAnyPermission: (perms: string[]) => boolean
): boolean {
  return (
    isFeatureEnabled("fees_management") &&
    hasAnyPermission([
      PERMS.FINANCE_READ,
      PERMS.FINANCE_MANAGE,
      PERMS.FEES_INVOICE_READ,
    ])
  );
}
