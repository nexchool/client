import i18n from "./i18nextInstance";
import { resources, I18N_NAMESPACES, SUPPORTED_LANGUAGES, type SupportedLanguage } from "./config";
import { resolveInitialLanguage } from "./resolveInitialLanguage";

let initPromise: Promise<void> | null = null;

export function initI18n(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (i18n.isInitialized) {
      return;
    }

    const lng: SupportedLanguage = await resolveInitialLanguage();

    const initOptions = {
      resources: resources as unknown as Record<
        string,
        Record<string, Record<string, unknown>>
      >,
      lng,
      fallbackLng: "en",
      supportedLngs: [...SUPPORTED_LANGUAGES],
      nonExplicitSupportedLngs: true,
      ns: [...I18N_NAMESPACES],
      defaultNS: "common",
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: "v4" as const,
    };

    try {
      await i18n.init(initOptions);
    } catch (e) {
      console.error("i18n init failed, retrying with English fallback", e);
      if (!i18n.isInitialized) {
        await i18n.init({
          ...initOptions,
          lng: "en",
        });
      }
    }
  })();

  return initPromise;
}
