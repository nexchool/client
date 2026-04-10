/**
 * Register Expo push token with School ERP backend (/api/devices/register).
 * Unregister on logout via /api/devices/unregister.
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { apiPost } from "@/common/services/api";
import {
  clearPushDeviceToken,
  getPushDeviceToken,
  getPushNotificationsPreference,
  setPushDeviceToken,
} from "@/common/utils/storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function resolveExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Ask OS permission, obtain Expo push token, POST /api/devices/register.
 * No-op on simulators / missing projectId (Expo Go may still work for token in dev).
 */
export async function registerDeviceForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  const preferenceOn = await getPushNotificationsPreference();
  if (!preferenceOn) {
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return;
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    console.warn(
      "[push] Missing EAS projectId in app config; cannot get Expo push token."
    );
    return;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoToken = tokenData.data;
  if (!expoToken) return;

  const platform = Platform.OS === "ios" ? "ios" : "android";
  const appVersion = Constants.expoConfig?.version ?? undefined;

  await apiPost("/api/devices/register", {
    device_token: expoToken,
    platform,
    provider: "expo",
    app_version: appVersion,
  });

  await setPushDeviceToken(expoToken);
}

/** Mark current device token inactive on server; clear local copy. */
export async function unregisterDevicePushNotifications(): Promise<void> {
  const token = await getPushDeviceToken();
  if (!token) return;
  try {
    await apiPost("/api/devices/unregister", { device_token: token });
  } catch {
    /* offline / 401 — still clear local */
  }
  await clearPushDeviceToken();
}
