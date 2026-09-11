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
          // eslint-disable-next-line no-restricted-syntax -- Android notification channel light color requires a literal ARGB hex for the OS API, not a palette token.
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
 * Why a registration attempt ended the way it did.
 *
 * This function used to return `void` and bail out of five different places
 * with a bare `return`, and its one caller discarded the exception from the
 * sixth. The result was a feature that could be completely broken in
 * production — the server's device_tokens table empty, every push silently
 * undeliverable — while the app reported exactly nothing, on any device, ever.
 * Some of these outcomes are perfectly normal (a simulator, somebody who said
 * no) and some mean push is dead for everyone; saying which is the entire
 * point.
 */
export type PushRegistrationOutcome =
  | { status: "registered"; token: string }
  /** Expected and harmless. Not worth an error, worth being able to see. */
  | {
      status: "skipped";
      reason:
        | "not_a_physical_device"
        | "preference_off"
        | "notifications_module_unavailable"
        | "permission_denied";
    }
  /** Push is broken for this build. Somebody needs to know. */
  | {
      status: "failed";
      reason: "missing_project_id" | "token_request_failed" | "server_rejected";
      error?: unknown;
    };

/**
 * Ask OS permission, obtain an Expo push token, POST /api/devices/register.
 *
 * Never throws: the caller gets an outcome describing what happened, including
 * for the failure cases, so that "push does not work" is a thing the logs can
 * say rather than a thing somebody has to infer from an empty table months
 * later.
 */
export async function registerDeviceForPushNotifications(): Promise<PushRegistrationOutcome> {
  if (!Device.isDevice) return { status: "skipped", reason: "not_a_physical_device" };

  const preferenceOn = await getPushNotificationsPreference();
  if (!preferenceOn) return { status: "skipped", reason: "preference_off" };

  const Notifications = await getNotifications();
  if (!Notifications) {
    return { status: "skipped", reason: "notifications_module_unavailable" };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return { status: "skipped", reason: "permission_denied" };

  const projectId = resolveExpoProjectId();
  if (!projectId) return { status: "failed", reason: "missing_project_id" };

  let expoToken: string | undefined;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    expoToken = tokenData?.data;
  } catch (error) {
    // The failure this codebase actually shipped. On Android, Expo cannot mint
    // a push token until the app has registered with FCM, and it cannot do
    // that without the `google-services.json` named by
    // `android.googleServicesFile` in app.config.ts. Expo Go bundles Expo's
    // own, so this throws in standalone builds and nowhere else — the exact
    // shape of "it worked when I wrote it".
    return { status: "failed", reason: "token_request_failed", error };
  }
  if (!expoToken) return { status: "failed", reason: "token_request_failed" };

  const platform = Platform.OS === "ios" ? "ios" : "android";
  const appVersion = Constants.expoConfig?.version ?? undefined;

  try {
    await apiPost("/api/devices/register", {
      device_token: expoToken,
      platform,
      provider: "expo",
      app_version: appVersion,
    });
  } catch (error) {
    // Not stored locally on purpose: setPushDeviceToken is what later tells
    // unregister which token to retire, and recording one the server never
    // accepted would leave this device believing it is registered when the
    // only record of it is on the phone.
    return { status: "failed", reason: "server_rejected", error };
  }

  await setPushDeviceToken(expoToken);
  return { status: "registered", token: expoToken };
}

/**
 * Report an outcome once, at the level it deserves.
 *
 * Kept next to the outcome type so every caller says the same thing about the
 * same result, and so the noisy-but-normal cases stay out of the error stream.
 */
export function logPushRegistrationOutcome(outcome: PushRegistrationOutcome): void {
  if (outcome.status === "registered") return;
  if (outcome.status === "skipped") {
    console.info(`[push] registration skipped: ${outcome.reason}`);
    return;
  }
  console.error(
    `[push] registration FAILED: ${outcome.reason} — push notifications will not be delivered to this device`,
    outcome.error ?? "",
  );
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
