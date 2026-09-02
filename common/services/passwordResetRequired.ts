/**
 * Notices that the server is refusing this session until the password is
 * replaced.
 *
 * `force_password_reset` used to be advice the client could ignore: a
 * provisioned account still received a fully privileged token, so a teacher
 * could keep the password their school typed in for them. The server now
 * enforces it — every endpoint outside a four-item allowlist (force-reset,
 * logout, profile, enabled-features) answers 403 with this error, and every
 * GraphQL operation is refused.
 *
 * That makes it a session-wide state rather than one screen's failed request,
 * which is why it is raised here instead of being handled where it lands. The
 * login and profile payloads carry the same flag and are the primary route to
 * the set-password screen; this is the backstop for any path that misses it.
 *
 * Same decoupled bridge as `sessionExpiry.ts` and `featureStamp.ts`, and for
 * the same reason: `api.ts` must not import AuthContext, which imports it.
 * The HTTP layer raises the signal; the auth layer decides what it means.
 */

/**
 * The exact `error` value the server sends with the 403. A generic 403 is an
 * ordinary permission failure and belongs to the screen that asked for it, so
 * only this value may be read as a demand to change the password.
 */
export const PASSWORD_RESET_REQUIRED_ERROR = 'PasswordResetRequired';

type PasswordResetRequiredHandler = () => void;

let handler: PasswordResetRequiredHandler | null = null;
let notified = false;

/**
 * Register the handler invoked when the server demands a password change.
 * Returns an unsubscribe fn. Only one handler is active at a time.
 */
export function registerPasswordResetRequiredHandler(
  fn: PasswordResetRequiredHandler,
): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/**
 * Report a refused-until-reset session, firing the handler at most once.
 *
 * A dashboard with six queries in flight gets six 403s; the user should be
 * moved to the set-password screen once. Nothing is latched while no handler
 * is registered, so a 403 racing the provider's mount is not swallowed.
 */
export function notifyPasswordResetRequired(): void {
  if (notified || !handler) return;
  notified = true;
  handler();
}

/**
 * Re-arm the one-shot — call once the demand is satisfied or a new session
 * starts, so the *next* account to be locked out is acted on rather than
 * treated as already handled.
 */
export function resetPasswordResetRequired(): void {
  notified = false;
}

/** Test-only: reset module state between cases. */
export function __resetPasswordResetRequiredForTests(): void {
  handler = null;
  notified = false;
}
