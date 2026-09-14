/**
 * Notice that the signed-in tenant has been suspended for non-payment.
 *
 * `_reject_inactive_tenant` (server `core/tenant.py`) answers 403
 * `TenantSuspended` on every tenant-scoped read/write outside `/api/auth/`
 * and `/api/subscription` once a school is suspended — for every role,
 * admin included, since the middleware has no notion of who is asking. A
 * session that was already open when the suspension happened has no other
 * way to find out: it was never told at sign-in, and nothing before this
 * read the code off a response.
 *
 * Same decoupled bridge as `sessionExpiry.ts`, for the same reason: `api.ts`
 * must not import AuthContext, which imports it. The HTTP layer raises the
 * signal; the auth layer decides what it means — which, here, is different
 * per role: an admin is meant to keep working from the subscription screen
 * (see the redirect in `app/(protected)/_layout.tsx`), so only a non-admin
 * is signed out by the registered handler.
 */

type TenantSuspendedHandler = () => void;

let handler: TenantSuspendedHandler | null = null;
let notified = false;

/**
 * Register the handler invoked when the tenant is found suspended. Returns
 * an unsubscribe fn. Only one handler is active at a time.
 */
export function registerTenantSuspendedHandler(fn: TenantSuspendedHandler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/**
 * Report a suspended-tenant response, firing the handler at most once.
 *
 * A screen with several queries in flight when the suspension is discovered
 * gets several 403s. Whatever the handler does for this session, it should
 * do it once, not once per request.
 */
export function notifyTenantSuspended(): void {
  if (notified || !handler) return;
  notified = true;
  handler();
}

/** Re-arm for the next session — call once a new one is established. */
export function resetTenantSuspendedNotice(): void {
  notified = false;
}

/** Test-only: reset module state between cases. */
export function __resetTenantSuspendedForTests(): void {
  handler = null;
  notified = false;
}
