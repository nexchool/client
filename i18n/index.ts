export { default as i18n } from "./i18nextInstance";
export { initI18n } from "./initI18n";
export { setAppLanguage, getAppLanguage } from "./language";
export {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  I18N_NAMESPACES,
  resources,
  type SupportedLanguage,
  type I18nNamespace,
} from "./config";
export { resolveInitialLanguage, deviceLanguageTag } from "./resolveInitialLanguage";
