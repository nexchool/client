import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PERMISSIONS: 'permissions',
  ENABLED_FEATURES: 'enabled_features',
  TENANT_ID: 'tenant_id',
  TENANT_NAME: 'tenant_name',
  SELECTED_ACADEMIC_YEAR_ID: 'selected_academic_year_id',
  PUSH_DEVICE_TOKEN: 'push_device_token',
  /** User preference: receive push alerts (default on). Not cleared on logout. */
  PUSH_NOTIFICATIONS_ENABLED: 'push_notifications_enabled',
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

export const clearAuth = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.USER_DATA),
    SecureStore.deleteItemAsync(KEYS.PERMISSIONS),
    SecureStore.deleteItemAsync(KEYS.ENABLED_FEATURES),
    SecureStore.deleteItemAsync(KEYS.TENANT_ID),
    SecureStore.deleteItemAsync(KEYS.TENANT_NAME),
    SecureStore.deleteItemAsync(KEYS.SELECTED_ACADEMIC_YEAR_ID),
    clearPushDeviceToken(),
  ]);
};
