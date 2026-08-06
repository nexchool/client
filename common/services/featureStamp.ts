/**
 * Notices, mid-session, that the school's enabled modules have changed.
 *
 * The app already re-reads the profile when it comes back to the foreground,
 * which covers a super-admin switching Transport off while the phone was in
 * somebody's pocket. It does not cover the app staying open: a parent looking
 * at the drawer keeps a Transport entry the school no longer has until they
 * background it and come back.
 *
 * The API stamps every response with `X-Feature-Stamp`, derived from the
 * enabled set. We hold the last one seen; a response carrying a different one
 * means the modules changed, and the auth layer re-reads the profile. No
 * polling — the signal rides along with work the app was doing anyway.
 *
 * Same shape as admin-web's `src/lib/featureStamp.ts`, and a decoupled bridge
 * for the same reason: `api.ts` must not import AuthContext, which imports it.
 */

type FeatureChangeHandler = () => void;

let handler: FeatureChangeHandler | null = null;
let lastStamp: string | null = null;

/**
 * Register the handler invoked when the enabled module set changes. Returns an
 * unsubscribe fn. Only one handler is active at a time.
 */
export function registerFeatureChangeHandler(fn: FeatureChangeHandler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/**
 * Record the stamp from a response, firing the handler when it differs from
 * the last one seen.
 *
 * The first stamp of a session is the baseline, not a change — firing on it
 * would make every login immediately re-fetch the profile it just received.
 *
 * `lastStamp` moves before the handler runs, so a screen firing six requests
 * at once costs one refresh rather than six.
 */
export function noteFeatureStamp(stamp: string | null): void {
  if (!stamp) return;
  const previous = lastStamp;
  lastStamp = stamp;
  if (previous === null || previous === stamp) return;
  handler?.();
}

/** Forget the baseline — call on logout, so the next session starts clean. */
export function resetFeatureStamp(): void {
  lastStamp = null;
}

/** Test-only: reset module state between cases. */
export function __resetFeatureStampForTests(): void {
  handler = null;
  lastStamp = null;
}
