import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PERMISSIONS: 'permissions',
  ENABLED_FEATURES: 'enabled_features',
  TENANT_ID: 'tenant_id',
  TENANT_NAME: 'tenant_name',
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
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
};

export const getAccessToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
};

export const setRefreshToken = async (token: string) => {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
};

export const setUserData = async (userData: any) => {
  await SecureStore.setItemAsync(KEYS.USER_DATA, JSON.stringify(userData));
};

export const getUserData = async (): Promise<any | null> => {
  const data = await SecureStore.getItemAsync(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
};

export const setPermissions = async (permissions: string[]) => {
  await SecureStore.setItemAsync(KEYS.PERMISSIONS, JSON.stringify(permissions));
};

export const getPermissions = async (): Promise<string[] | null> => {
  const data = await SecureStore.getItemAsync(KEYS.PERMISSIONS);
  return data ? JSON.parse(data) : null;
};

export const setEnabledFeatures = async (features: string[]) => {
  await SecureStore.setItemAsync(KEYS.ENABLED_FEATURES, JSON.stringify(features));
};

export const getEnabledFeatures = async (): Promise<string[] | null> => {
  const data = await SecureStore.getItemAsync(KEYS.ENABLED_FEATURES);
  return data ? JSON.parse(data) : null;
};

export const setTenantId = async (tenantId: string) => {
  await SecureStore.setItemAsync(KEYS.TENANT_ID, tenantId);
};

export const getTenantId = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(KEYS.TENANT_ID);
};

export const setTenantName = async (name: string) => {
  await SecureStore.setItemAsync(KEYS.TENANT_NAME, name);
};

export const getTenantName = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(KEYS.TENANT_NAME);
};

export const deleteTenantName = async () => {
  await SecureStore.deleteItemAsync(KEYS.TENANT_NAME);
};

/**
 * Whether the school-issued password must be replaced before the app is usable.
 *
 * Persisted rather than held only in memory because a cold start restores the
 * session from storage without asking the server first — without this the app
 * would open on a home screen every request of which the server refuses.
 */
export const setForcePasswordReset = async (required: boolean) => {
  await SecureStore.setItemAsync(
    KEYS.FORCE_PASSWORD_RESET,
    required ? 'true' : 'false'
  );
};

export const getForcePasswordReset = async (): Promise<boolean> => {
  const value = await SecureStore.getItemAsync(KEYS.FORCE_PASSWORD_RESET);
  return value === 'true';
};

export const setSelectedAcademicYearId = async (id: string) => {
  await SecureStore.setItemAsync(KEYS.SELECTED_ACADEMIC_YEAR_ID, id);
};

export const getSelectedAcademicYearId = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(KEYS.SELECTED_ACADEMIC_YEAR_ID);
};

export const setPushDeviceToken = async (token: string) => {
  await SecureStore.setItemAsync(KEYS.PUSH_DEVICE_TOKEN, token);
};

export const getPushDeviceToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(KEYS.PUSH_DEVICE_TOKEN);
};

export const clearPushDeviceToken = async () => {
  try {
    await SecureStore.deleteItemAsync(KEYS.PUSH_DEVICE_TOKEN);
  } catch {
    /* ignore */
  }
};

/** Whether the user wants school push alerts (defaults to true if unset). */
export const getPushNotificationsPreference = async (): Promise<boolean> => {
  const v = await SecureStore.getItemAsync(KEYS.PUSH_NOTIFICATIONS_ENABLED);
  if (v == null || v === "") return true;
  return v === "true" || v === "1";
};

export const setPushNotificationsPreference = async (enabled: boolean) => {
  await SecureStore.setItemAsync(
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
  await SecureStore.setItemAsync(KEYS.RECENT_SEARCHES, JSON.stringify(terms));
};

export const getRecentSearches = async (): Promise<string[]> => {
  const raw = await SecureStore.getItemAsync(KEYS.RECENT_SEARCHES);
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
    await SecureStore.deleteItemAsync(KEYS.TENANT_THEME);
    return;
  }
  await SecureStore.setItemAsync(KEYS.TENANT_THEME, JSON.stringify(colors));
};

export const getCachedTenantTheme = async (): Promise<Record<string, string> | null> => {
  const raw = await SecureStore.getItemAsync(KEYS.TENANT_THEME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : null;
  } catch {
    return null;
  }
};

export const clearAuth = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.USER_DATA),
    SecureStore.deleteItemAsync(KEYS.PERMISSIONS),
    SecureStore.deleteItemAsync(KEYS.ENABLED_FEATURES),
    SecureStore.deleteItemAsync(KEYS.TENANT_ID),
    SecureStore.deleteItemAsync(KEYS.TENANT_NAME),
    SecureStore.deleteItemAsync(KEYS.FORCE_PASSWORD_RESET),
    SecureStore.deleteItemAsync(KEYS.SELECTED_ACADEMIC_YEAR_ID),
    SecureStore.deleteItemAsync(KEYS.RECENT_SEARCHES),
    SecureStore.deleteItemAsync(KEYS.TENANT_THEME),
    clearPushDeviceToken(),
  ]);
};
