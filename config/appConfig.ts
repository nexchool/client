import Constants from "expo-constants";

export type AppEnvironment = "development" | "preview" | "production";

type Extra = {
  appName?: string;
  apiBaseUrl?: string;
  environment?: AppEnvironment;
  eas?: { projectId?: string };
};

function getExtra(): Extra {
  return (Constants.expoConfig?.extra as Extra | undefined) ?? {};
}

/** Display name from Expo config (`extra.appName`). */
export function getAppName(): string {
  const extra = getExtra();
  if (typeof extra.appName === "string" && extra.appName.length > 0) {
    return extra.appName;
  }
  return Constants.expoConfig?.name ?? "Nexchool";
}

/**
 * Production API base URL: prefer `expo.extra.apiBaseUrl` (set in app.config.ts from
 * `EXPO_PUBLIC_BACKEND_URL` at build/update time), then bundle env fallback.
 */
export function getProductionApiBaseUrl(): string {
  const extra = getExtra();
  const fromExtra = typeof extra.apiBaseUrl === "string" ? extra.apiBaseUrl.trim() : "";
  if (fromExtra) return fromExtra.replace(/\/$/, "");

  const fromEnv = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").trim();
  return fromEnv.replace(/\/$/, "");
}

/** Logical environment from `extra.environment` (EAS / app.config), not `__DEV__`. */
export function getConfiguredEnvironment(): AppEnvironment {
  const extra = getExtra();
  const e = extra.environment;
  if (e === "development" || e === "preview" || e === "production") return e;
  return __DEV__ ? "development" : "production";
}

/** EAS project id from `expo.extra.eas.projectId` (for diagnostics / tooling). */
export function getEasProjectId(): string | undefined {
  return getExtra().eas?.projectId;
}
