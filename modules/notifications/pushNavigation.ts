import type { Router } from "expo-router";

/** Normalize Expo notification `data` to string map (FCM-style). */
export function normalizePushData(
  raw: Record<string, unknown> | undefined | null
): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") continue;
    out[String(k)] = typeof v === "string" ? v : String(v);
  }
  return out;
}

function resolveEntityHrefFromData(data: Record<string, string>): string | null {
  const screen = (data.screen || "").toLowerCase();
  const typeUpper = (data.type || "").toUpperCase();
  const studentFeeId = (data.student_fee_id || "").trim();
  const entityId = (data.entity_id || "").trim();

  // Teacher leave notifications
  if (
    typeUpper === "TEACHER_LEAVE_APPROVED" ||
    typeUpper === "TEACHER_LEAVE_REJECTED" ||
    screen === "my_leaves"
  ) {
    return "/(protected)/my-leaves";
  }
  if (
    typeUpper === "TEACHER_LEAVE_REQUEST" ||
    typeUpper === "TEACHER_UNAVAILABILITY_ADDED" ||
    screen === "teacher_leaves"
  ) {
    // Admin viewing teacher leave requests in mobile app
    return "/(protected)/my-leaves";
  }

  if (studentFeeId) {
    return `/(protected)/finance/student-fees/${studentFeeId}`;
  }
  if (
    entityId &&
    (screen === "student_fee" ||
      screen === "student_fees" ||
      typeUpper.includes("FEE"))
  ) {
    return `/(protected)/finance/student-fees/${entityId}`;
  }
  if (screen === "finance") {
    return "/(protected)/finance";
  }
  return null;
}

const FINANCE_ROUTE_PREFIX = "/(protected)/finance";

function isFinanceDeepLink(href: string | null): boolean {
  return Boolean(href?.startsWith(FINANCE_ROUTE_PREFIX));
}

/** In-app / API row: deep link to fee, finance home, etc. — not the generic inbox/detail. */
export function getNotificationEntityHref(
  type: string,
  extra: Record<string, unknown> | null | undefined,
  canOpenFinanceRoutes = true
): string | null {
  const data = normalizePushData(extra as Record<string, unknown> | undefined);
  data.type = type;
  const href = resolveEntityHrefFromData(data);
  if (isFinanceDeepLink(href) && !canOpenFinanceRoutes) {
    return null;
  }
  return href;
}

/**
 * Navigate from push `data` (see PushStrategy base_data + extra keys).
 * When `canOpenFinanceRoutes` is false, fee/finance deep links are skipped so users are not sent to routes that redirect to home.
 */
export function navigateFromPushData(
  router: Router,
  data: Record<string, string>,
  canOpenFinanceRoutes = true
): void {
  let entityHref = resolveEntityHrefFromData(data);
  if (isFinanceDeepLink(entityHref) && !canOpenFinanceRoutes) {
    entityHref = null;
  }
  if (entityHref) {
    router.push(entityHref as never);
    return;
  }
  const nid = (data.notification_id || "").trim();
  if (nid) {
    router.push(`/(protected)/notifications/${nid}` as never);
    return;
  }
  router.push("/(protected)/notifications" as never);
}

/** Merge API `extra_data` and notification `type` like push payload. */
export function navigateFromNotificationRow(
  router: Router,
  type: string,
  extra: Record<string, unknown> | null | undefined,
  canOpenFinanceRoutes = true
): void {
  const data = normalizePushData(extra as Record<string, unknown> | undefined);
  data.type = type;
  navigateFromPushData(router, data, canOpenFinanceRoutes);
}
