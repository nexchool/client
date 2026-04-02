import type { ConfigContext, ExpoConfig } from "expo/config";

/** EAS project (Expo dashboard) — used for EAS Build / Updates URL. */
const EAS_PROJECT_ID = "e2702f4e-9aa0-4063-be88-bb9ee5853ee6";

const EAS_UPDATE_URL = `https://u.expo.dev/${EAS_PROJECT_ID}`;

type AppEnv = "development" | "preview" | "production";

function resolveAppEnv(): AppEnv {
  const explicit = process.env.EXPO_PUBLIC_APP_ENV as AppEnv | undefined;
  if (explicit === "development" || explicit === "preview" || explicit === "production") {
    return explicit;
  }
  const profile = process.env.EAS_BUILD_PROFILE;
  if (profile === "production") return "production";
  if (profile === "preview") return "preview";
  if (profile === "development") return "development";
  return "development";
}

/**
 * Production API base URL for release builds: set via EAS `env` per profile
 * or local `.env` (`EXPO_PUBLIC_BACKEND_URL`). Baked at build/update time.
 */
const apiBaseUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim() || "https://api.nexchool.in";

const appEnv = resolveAppEnv();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Nexchool",
  slug: "nexchool",
  owner: "nexchool",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "nexchool",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: EAS_UPDATE_URL,
    enabled: true,
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "in.nexchool.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  web: {
    output: "static",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "@config-plugins/react-native-blob-util",
    "@config-plugins/react-native-pdf",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "expo-updates",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: EAS_PROJECT_ID,
    },
    appName: "Nexchool",
    apiBaseUrl,
    environment: appEnv,
  },
});
