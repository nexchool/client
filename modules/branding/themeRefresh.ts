/**
 * Tells the theme to re-read itself when the session changes.
 *
 * The theme provider wraps the auth provider — it has to, so that a crash
 * inside auth still renders a styled error screen — which means it cannot
 * watch the signed-in tenant directly. Same decoupled bridge as
 * `sessionExpiry.ts` and `featureStamp.ts`, and for the same reason: the layer
 * that knows something changed must not have to import the layer that cares.
 *
 * Without it, signing into a different school would keep the previous school's
 * colours until the app was next backgrounded.
 */

type Handler = () => void;

let handler: Handler | null = null;

/** Register the refresher. Returns an unsubscribe fn. One handler at a time. */
export function registerThemeRefreshHandler(fn: Handler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/** Re-read the school's colours — call after a session starts or ends. */
export function notifyThemeRefresh(): void {
  handler?.();
}
