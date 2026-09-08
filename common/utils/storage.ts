import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Backend for every read/write/delete below.
 *
 * Native: `expo-secure-store`, completely unchanged. `store` *is* the
 * `SecureStore` module object on native — not a wrapper around it — so every
 * call below (`store.setItemAsync(...)`) is the exact same function call,
 * with the exact same await and the exact same error behaviour, that used to
 * be written as `SecureStore.setItemAsync(...)`. Nothing about native
 * behaviour changes by this file knowing web exists.
 *
 * Web: `expo-secure-store` has no web implementation — it isn't a shim with
 * reduced guarantees, it simply doesn't exist there, and calling it throws
 * `getValueWithKeyAsync is not a function` before a single pixel renders.
 * That crash used to take down every screen that touches storage on load,
 * including the login screen the web target exists to let us look at (see
 * `.claude/memory/v2-refactor.md` — web is a dev-time renderer, not a
 * shipping target).
 *
 * `localStorage` is the fallback, and it is **not** a substitute for secure
 * storage: it is plain text, readable by any script running on the page's
 * origin, and not encrypted at rest. Shipping a real login on top of it would
 * put refresh tokens where any XSS on the page could read them. That is
 * acceptable here for exactly one reason — this path only exists to serve
 * the Expo **web** target, which this project has never shipped and does not
 * plan to. It is not an endorsement of `localStorage` for anything real; it
 * is a rendering convenience for a target with no production audience.
 *
 * To keep that line from blurring, the web backend refuses to persist once
 * `__DEV__` is false: it logs once and every read comes back empty rather
 * than writing session data to `localStorage`. It does not throw in that
 * case — throwing would crash the very bootstrap paths (theme cache, session
 * restore) this file exists to stop crashing, which would just swap one
 * startup crash for another. A quiet no-op is the more honest failure mode
 * for "this build should not be trusted with real credentials."
 *
 * The platform decision is made once, right here — every function below
 * calls `store.xxxAsync`, never `Platform.OS` directly.
 */
interface StorageBackend {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const WEB_STORAGE_DISABLED_WARNING =
  'storage: refusing to persist to localStorage outside development. ' +
  'The web target is a development renderer only and must never hold real session data.';

let warnedWebStorageDisabled = false;

const webBackend: StorageBackend = {
  async getItemAsync(key) {
    if (!__DEV__) {
      if (!warnedWebStorageDisabled) {
        warnedWebStorageDisabled = true;
        console.error(WEB_STORAGE_DISABLED_WARNING);
      }
      return null;
    }
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      // Private browsing, disabled site data, or no localStorage at all —
      // treat it as "nothing stored" rather than crashing the caller.
      return null;
    }
  },
  async setItemAsync(key, value) {
    if (!__DEV__) {
      if (!warnedWebStorageDisabled) {
        warnedWebStorageDisabled = true;
        console.error(WEB_STORAGE_DISABLED_WARNING);
      }
      return;
    }
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // A write we can't make (quota, disabled storage) isn't worth a crash.
    }
  },
  async deleteItemAsync(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore — nothing to clean up if storage never worked */
    }
  },
};

const store: StorageBackend = Platform.OS === 'web' ? webBackend : SecureStore;

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PERMISSIONS: 'permissions',
  ENABLED_FEATURES: 'enabled_features',
  TENANT_ID: 'tenant_id',
  TENANT_NAME: 'tenant_name',
  /** The school's subdomain, known before a tenant_id exists — see setTenantSubdomain. */
  TENANT_SUBDOMAIN: 'tenant_subdomain',
  FORCE_PASSWORD_RESET: 'force_password_reset',
  SELECTED_ACADEMIC_YEAR_ID: 'selected_academic_year_id',
  PUSH_DEVICE_TOKEN: 'push_device_token',
  /** User preference: receive push alerts (default on). Not cleared on logout. */
  PUSH_NOTIFICATIONS_ENABLED: 'push_notifications_enabled',
  /** Recently used global-search terms, most recent first. Cleared on logout. */
  RECENT_SEARCHES: 'recent_searches',
  /** The school's resolved colour palette, so a cold start opens branded. */
  TENANT_THEME: 'tenant_theme',
} as const;

export const setAccessToken = async (token: string) => {
  await store.setItemAsync(KEYS.ACCESS_TOKEN, token);
};

export const getAccessToken = async (): Promise<string | null> => {
  return store.getItemAsync(KEYS.ACCESS_TOKEN);
};

export const setRefreshToken = async (token: string) => {
  await store.setItemAsync(KEYS.REFRESH_TOKEN, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return store.getItemAsync(KEYS.REFRESH_TOKEN);
};

export const setUserData = async (userData: any) => {
  await store.setItemAsync(KEYS.USER_DATA, JSON.stringify(userData));
};

export const getUserData = async (): Promise<any | null> => {
  const data = await store.getItemAsync(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
};

export const setPermissions = async (permissions: string[]) => {
  await store.setItemAsync(KEYS.PERMISSIONS, JSON.stringify(permissions));
};

export const getPermissions = async (): Promise<string[] | null> => {
  const data = await store.getItemAsync(KEYS.PERMISSIONS);
  return data ? JSON.parse(data) : null;
};

export const setEnabledFeatures = async (features: string[]) => {
  await store.setItemAsync(KEYS.ENABLED_FEATURES, JSON.stringify(features));
};

export const getEnabledFeatures = async (): Promise<string[] | null> => {
  const data = await store.getItemAsync(KEYS.ENABLED_FEATURES);
  return data ? JSON.parse(data) : null;
};

export const setTenantId = async (tenantId: string) => {
  await store.setItemAsync(KEYS.TENANT_ID, tenantId);
};

export const getTenantId = async (): Promise<string | null> => {
  return store.getItemAsync(KEYS.TENANT_ID);
};

export const setTenantName = async (name: string) => {
  await store.setItemAsync(KEYS.TENANT_NAME, name);
};

export const getTenantName = async (): Promise<string | null> => {
  return store.getItemAsync(KEYS.TENANT_NAME);
};

export const deleteTenantName = async () => {
  await store.deleteItemAsync(KEYS.TENANT_NAME);
};

/**
 * The school's subdomain (e.g. "greenwood"), known before any tenant_id is.
 *
 * A build with no school baked in (see `config/appConfig.ts#getBakedTenant`)
 * has no tenant_id until someone signs in, so it cannot send `X-Tenant-ID` —
 * but the school-selection step can still name a subdomain, and the server
 * resolves a tenant from `X-Tenant-Subdomain` just as well (`core/tenant.py`
 * on the server). `common/services/api.ts` sends this header whenever there
 * is no tenant_id yet.
 */
export const setTenantSubdomain = async (subdomain: string) => {
  await store.setItemAsync(KEYS.TENANT_SUBDOMAIN, subdomain);
};

export const getTenantSubdomain = async (): Promise<string | null> => {
  return store.getItemAsync(KEYS.TENANT_SUBDOMAIN);
};

export const deleteTenantSubdomain = async () => {
  await store.deleteItemAsync(KEYS.TENANT_SUBDOMAIN);
};

/**
 * Whether the app can identify a school at all — a resolved tenant_id, or
 * just a subdomain the school-selection step recorded before any tenant_id
 * existed. Neither `X-Tenant-ID` nor `X-Tenant-Subdomain` is "the" tenant
 * header on its own (`common/services/api.ts` picks whichever is stored), so
 * anywhere that only needs to know "is there enough to ask the server with" —
 * `usePublishedAuthMethods`, `useTenantTheme`, the initial-route redirect in
 * `app/index.tsx` — should ask this rather than `getTenantId()` alone, or a
 * general build stuck on the school-selection subdomain would look
 * tenant-less to them even after someone had already answered it.
 */
export const hasKnownTenant = async (): Promise<boolean> => {
  const [tenantId, tenantSubdomain] = await Promise.all([
    getTenantId(),
    getTenantSubdomain(),
  ]);
  return !!(tenantId || tenantSubdomain);
};

/**
 * Whether the school-issued password must be replaced before the app is usable.
 *
 * Persisted rather than held only in memory because a cold start restores the
 * session from storage without asking the server first — without this the app
 * would open on a home screen every request of which the server refuses.
 */
export const setForcePasswordReset = async (required: boolean) => {
  await store.setItemAsync(
    KEYS.FORCE_PASSWORD_RESET,
    required ? 'true' : 'false'
  );
};

export const getForcePasswordReset = async (): Promise<boolean> => {
  const value = await store.getItemAsync(KEYS.FORCE_PASSWORD_RESET);
  return value === 'true';
};

export const setSelectedAcademicYearId = async (id: string) => {
  await store.setItemAsync(KEYS.SELECTED_ACADEMIC_YEAR_ID, id);
};

export const getSelectedAcademicYearId = async (): Promise<string | null> => {
  return store.getItemAsync(KEYS.SELECTED_ACADEMIC_YEAR_ID);
};

export const setPushDeviceToken = async (token: string) => {
  await store.setItemAsync(KEYS.PUSH_DEVICE_TOKEN, token);
};

export const getPushDeviceToken = async (): Promise<string | null> => {
  return store.getItemAsync(KEYS.PUSH_DEVICE_TOKEN);
};

export const clearPushDeviceToken = async () => {
  try {
    await store.deleteItemAsync(KEYS.PUSH_DEVICE_TOKEN);
  } catch {
    /* ignore */
  }
};

/** Whether the user wants school push alerts (defaults to true if unset). */
export const getPushNotificationsPreference = async (): Promise<boolean> => {
  const v = await store.getItemAsync(KEYS.PUSH_NOTIFICATIONS_ENABLED);
  if (v == null || v === "") return true;
  return v === "true" || v === "1";
};

export const setPushNotificationsPreference = async (enabled: boolean) => {
  await store.setItemAsync(
    KEYS.PUSH_NOTIFICATIONS_ENABLED,
    enabled ? "true" : "false"
  );
};

/**
 * Recent global-search terms, most recent first.
 *
 * Encrypted like everything else in this module rather than dropped in plain
 * AsyncStorage: what somebody searched for in a school app is a list of
 * children's names and admission numbers, and it is cleared on sign-out with
 * the rest of the session.
 */
export const setRecentSearches = async (terms: string[]) => {
  await store.setItemAsync(KEYS.RECENT_SEARCHES, JSON.stringify(terms));
};

export const getRecentSearches = async (): Promise<string[]> => {
  const raw = await store.getItemAsync(KEYS.RECENT_SEARCHES);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    // Written by an older build, or truncated. An unreadable history is not
    // worth an error — start a new one.
    return [];
  }
};

/**
 * The school's colours, cached so the app opens in them.
 *
 * Without this a cold start paints the built-in palette, then repaints when
 * the branding request lands — a visible flash of the wrong brand on every
 * launch. Cached, the fetch becomes a background correction nobody sees.
 *
 * Cleared with the session: this is a single app for every school, and the
 * next person to sign in on this phone may belong to a different one.
 */
export const setCachedTenantTheme = async (colors: Record<string, string> | null) => {
  if (colors === null) {
    await store.deleteItemAsync(KEYS.TENANT_THEME);
    return;
  }
  await store.setItemAsync(KEYS.TENANT_THEME, JSON.stringify(colors));
};

export const getCachedTenantTheme = async (): Promise<Record<string, string> | null> => {
  const raw = await store.getItemAsync(KEYS.TENANT_THEME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : null;
  } catch {
    return null;
  }
};

/**
 * Forget everything about the current sign-in — but not which school this
 * installation belongs to.
 *
 * `tenant_id` / `tenant_subdomain` used to be deleted here, on the theory
 * that a phone's next sign-in "resolves its own tenant from scratch". That
 * theory is wrong: which school an install belongs to is not a property of
 * a session or an account, it is a property of the phone. A baked build is
 * physically that school's app — signing out of it does not make it stop
 * being that school's app. A general build becomes one school's app the
 * moment `select-school` names a subdomain, for the same reason a person
 * doesn't "forget" their school by logging out of its portal on the web.
 *
 * Deleting it here was actively harmful: a baked build fell back to the
 * generic, unbranded, method-blind login on *every* sign-out (not just first
 * launch, since `seedBakedTenant` only runs once per process and nothing else
 * calls it), and a general build at an OTP-only school lost `tenant_subdomain`
 * entirely — `hasKnownTenant()` went false, no methods were published, and the
 * screen fell back to an email form the school may not even issue credentials
 * for, with no link back to `select-school`.
 *
 * So sign-out (this function) leaves tenant identity alone. The only thing
 * that should ever clear it is a deliberate "switch school" action — see
 * `clearTenantIdentity` below — which does not exist as a UI flow yet and is
 * out of scope here; this export is the seam for it so nobody reaches for
 * `clearAuth` (or re-adds these two lines to it) to build one.
 */
export const clearAuth = async () => {
  await Promise.all([
    store.deleteItemAsync(KEYS.ACCESS_TOKEN),
    store.deleteItemAsync(KEYS.REFRESH_TOKEN),
    store.deleteItemAsync(KEYS.USER_DATA),
    store.deleteItemAsync(KEYS.PERMISSIONS),
    store.deleteItemAsync(KEYS.ENABLED_FEATURES),
    store.deleteItemAsync(KEYS.TENANT_NAME),
    store.deleteItemAsync(KEYS.FORCE_PASSWORD_RESET),
    store.deleteItemAsync(KEYS.SELECTED_ACADEMIC_YEAR_ID),
    store.deleteItemAsync(KEYS.RECENT_SEARCHES),
    store.deleteItemAsync(KEYS.TENANT_THEME),
    clearPushDeviceToken(),
  ]);
};

/**
 * Forget which school this installation belongs to — `tenant_id` and
 * `tenant_subdomain` both. Not called anywhere yet: there is no "switch
 * school" UI in the app today, and building one is out of scope for the fix
 * that added this function. It exists so that whenever that flow is built,
 * it has a correctly-named place to call instead of either reinventing this
 * or reaching back into `clearAuth` (see its docstring for why that would
 * reintroduce the bug this was split out of).
 */
export const clearTenantIdentity = async () => {
  await Promise.all([
    store.deleteItemAsync(KEYS.TENANT_ID),
    store.deleteItemAsync(KEYS.TENANT_SUBDOMAIN),
  ]);
};
