/**
 * Register Expo push token with School ERP backend (/api/devices/register).
 * Unregister on logout via /api/devices/unregister.
 *
 * expo-notifications remote push is not supported in Expo Go on Android (SDK 53+).
 * A dynamic import with try-catch is used so the module loads cleanly in Expo Go;
 * all functions become no-ops in that environment.
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { apiPost } from "@/common/services/api";
import {
  clearPushDeviceToken,
  getPushDeviceToken,
  getPushNotificationsPreference,
  setPushDeviceToken,
} from "@/common/utils/storage";

type NotificationsModule = typeof import("expo-notifications");

let _notifications: NotificationsModule | null = null;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (_notifications !== null) return _notifications;
  try {
    const mod = (await import("expo-notifications")) as NotificationsModule;
    if (Platform.OS === "android") {
      try {
        await mod.setNotificationChannelAsync("default", {
          name: "Default",
          importance: mod.AndroidImportance.HIGH,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      } catch {
        /* channel creation not supported / unavailable */
      }
    }
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    _notifications = mod;
    return _notifications;
  } catch {
    return null;
  }
}

// Eagerly attempt to initialise notifications on module load (non-blocking).
void getNotifications();

function resolveExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Ask OS permission, obtain Expo push token, POST /api/devices/register.
 * No-op on simulators, Expo Go (Android SDK 53+), missing projectId, or denied permissions.
 */
export async function registerDeviceForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  const preferenceOn = await getPushNotificationsPreference();
  if (!preferenceOn) return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

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
