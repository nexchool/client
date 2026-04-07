import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import {
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
  isSupportedLanguage,
} from "./config";

/**
 * Stored preference wins; otherwise map device locale to a supported language; default English.
 */
export async function resolveInitialLanguage(): Promise<SupportedLanguage> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // ignore read errors
  }

  const deviceCode =
    Localization.getLocales()[0]?.languageCode?.toLowerCase() ?? "en";
  if (deviceCode === "gu") {
    return "gu";
  }
  if (deviceCode === "hi") {
    return "hi";
  }
  return "en";
}

export function deviceLanguageTag(): string {
  return Localization.getLocales()[0]?.languageTag ?? "en";
}
