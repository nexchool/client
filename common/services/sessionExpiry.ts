/**
 * Notices that the server has stopped accepting this session.
 *
 * `api.ts` sends the refresh token alongside every request, so a 401 coming
 * back is not "try refreshing" — the refresh already happened on that same
 * request and failed. It is the server's final word: these credentials are
 * dead. Until now nothing read that, so an expired session left the user
 * inside a signed-in-looking app where every screen quietly failed to load and
 * signing out by hand was the only escape.
 *
 * Same decoupled bridge as `featureStamp.ts`, and for the same reason:
 * `api.ts` must not import AuthContext, which imports it. The HTTP layer
 * raises the signal; the auth layer decides what a lost session means.
 */

type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;
let notified = false;

/**
 * Register the handler invoked when the session is rejected. Returns an
 * unsubscribe fn. Only one handler is active at a time.
 */
export function registerSessionExpiredHandler(fn: SessionExpiredHandler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/**
 * Report a rejected session, firing the handler at most once.
 *
 * A screen that has six queries in flight when the refresh token expires gets
 * six 401s. The user should be signed out once and told once, not marched to
 * the login screen six times. Nothing is latched while no handler is
 * registered, so a 401 racing the provider's mount is not swallowed.
 */
export function notifySessionExpired(): void {
  if (notified || !handler) return;
  notified = true;
  handler();
}

/**
 * True when the session now being signed out of ended because the server
 * rejected it, rather than because the user asked to leave.
 *
 * Read by the sign-in screen so it can say why it is being shown. It lives
 * here rather than travelling as a route param because the protected layout
 * redirects to sign-in on its own the moment the session clears, and whichever
 * of the two redirects lands second would drop the param.
 */
export function didSessionExpire(): boolean {
  return notified;
}

/** Re-arm for the next session — call once a new one is established. */
export function resetSessionExpiry(): void {
  notified = false;
}

/** Test-only: reset module state between cases. */
export function __resetSessionExpiryForTests(): void {
  handler = null;
  notified = false;
}
