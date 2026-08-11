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
    // Without this there is no iOS build at all — nothing to sign, nothing to
    // submit. Android has carried `package` from the start; this is its
    // counterpart and deliberately the same string, so one identity covers the
    // app on both stores.
    bundleIdentifier: "in.nexchool.app",
    supportsTablet: true,
    infoPlist: {
      /**
       * `orientation: "portrait"` above locks the whole app, and the app ships
       * for iPad — so a teacher with the tablet in a keyboard case got a
       * sideways-locked screen. A tablet is held either way; a phone, for this
       * app, is not.
       *
       * These two keys are per-device, so the global lock keeps holding on
       * iPhone and only iPad is allowed to turn. Expo adds upside-down back
       * for iPad, which is right — an iPad has no wrong way up, and Apple
       * expects all four there. The same is not true of a phone.
       */
      "UISupportedInterfaceOrientations~ipad": [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
      ],
      UISupportedInterfaceOrientations: ["UIInterfaceOrientationPortrait"],
    },
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
    [
      // MyProfileScreen calls requestMediaLibraryPermissionsAsync to let
      // someone set their profile photo. On iOS an app that asks for a
      // protected resource without a purpose string is killed by the system on
      // the spot — not a permission denial, a crash — and App Review rejects
      // it besides. Android needs no equivalent, which is why this went
      // unnoticed.
      "expo-image-picker",
      {
        photosPermission:
          "Nexchool needs access to your photos so you can set your profile picture.",
      },
    ],
    "expo-localization",
    "@config-plugins/react-native-blob-util",
    "@config-plugins/react-native-pdf",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#f8f9ff",
      },
    ],
    "expo-updates",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#ffffff",
        sounds: [],
      },
    ],
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
