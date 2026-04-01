import * as Updates from "expo-updates";

export type BackgroundUpdateResult =
  | { status: "skipped"; reason: "dev" | "disabled" | "error"; error?: unknown }
  | { status: "upToDate" }
  | { status: "downloaded" };

/**
 * Checks for an OTA update and downloads it in the background.
 * Does not reload the app — the new JS applies on the next cold start,
 * or call `reloadAppWithPendingUpdateAsync()` if you want an immediate restart.
 */
export async function checkAndFetchUpdateInBackground(): Promise<BackgroundUpdateResult> {
  if (__DEV__) {
    return { status: "skipped", reason: "dev" };
  }
  try {
    if (!Updates.isEnabled) {
      return { status: "skipped", reason: "disabled" };
    }
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      return { status: "upToDate" };
    }
    await Updates.fetchUpdateAsync();
    return { status: "downloaded" };
  } catch (error) {
    return { status: "skipped", reason: "error", error };
  }
}

/**
 * Reloads the app so a downloaded OTA bundle takes effect.
 * Use sparingly (e.g. after user confirms) — prefer natural restart.
 */
export async function reloadAppWithPendingUpdateAsync(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  await Updates.reloadAsync();
}
