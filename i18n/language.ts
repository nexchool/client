import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "./i18nextInstance";
import {
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
  isSupportedLanguage,
} from "./config";

export async function setAppLanguage(lng: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

export function getAppLanguage(): SupportedLanguage {
  const base = (i18n.language ?? "en").split("-")[0] ?? "en";
  return isSupportedLanguage(base) ? base : "en";
}
