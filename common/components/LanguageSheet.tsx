import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Button } from '@/common/components/Button';
import { BottomSheet } from '@/common/components/sheet';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/config';
import { setAppLanguage, getAppLanguage } from '@/i18n';

/**
 * Each language named in itself.
 *
 * Deliberately not routed through `t()`. A picker whose options are written in
 * the language currently selected is only useful to someone who can already
 * read that language — which is exactly not the person opening it. Somebody
 * stuck in a UI they cannot read needs to find "ગુજરાતી", not "Gujarati"
 * rendered in Hindi. Every platform picker does it this way for the same
 * reason, and it is why these strings are constants rather than translations.
 */
const LANGUAGE_ENDONYM: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
  gu: 'ગુજરાતી',
};

export type LanguageSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Told after the language actually changed, so a screen can re-render. */
  onChanged?: (language: SupportedLanguage) => void;
};

/**
 * The app's language picker, in the one place both screens get it from.
 *
 * Profile and Settings each had their own: one a bottom sheet reading the
 * canonical `SUPPORTED_LANGUAGES`, the other a centred dropdown with its own
 * local `LANGUAGE_OPTIONS` array. They happened to agree on en/gu/hi, so
 * nothing was visibly broken — but adding a fourth language to `i18n/config`
 * would have appeared in one screen and silently not the other, and the two
 * looked and behaved differently in the meantime.
 *
 * The list is derived from `SUPPORTED_LANGUAGES`, so a language added to the
 * config appears here and in both screens at once, or not at all.
 */
export function LanguageSheet({ visible, onClose, onChanged }: LanguageSheetProps) {
  const { t } = useTranslation('profile');
  const { palette, spacing, radius } = useTheme();
  const current = getAppLanguage();

  const select = async (language: SupportedLanguage) => {
    onClose();
    if (language === current) return;
    await setAppLanguage(language);
    onChanged?.(language);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text variant="headlineMd" color="onSurface">
        {t('languageSheet.title', { defaultValue: 'Language' })}
      </Text>
      <Text variant="bodyMd" color="onSurfaceVariant">
        {t('languageSheet.subtitle', { defaultValue: 'Choose your preferred language.' })}
      </Text>

      <View style={{ gap: spacing.sm }}>
        {SUPPORTED_LANGUAGES.map((language) => {
          const isSelected = language === current;
          return (
            <Pressable
              key={language}
              onPress={() => void select(language)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radius.DEFAULT,
                backgroundColor: isSelected
                  ? palette.primaryContainer
                  : pressed
                    ? palette.surfaceContainer
                    : 'transparent',
              })}
            >
              <Text
                variant="bodyLg"
                color={isSelected ? 'onPrimaryContainer' : 'onSurface'}
                style={{ flex: 1 }}
              >
                {LANGUAGE_ENDONYM[language]}
              </Text>
              {isSelected ? (
                <AppIcon name="checkmark" size="lg" color="onPrimaryContainer" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Button variant="ghost" fullWidth onPress={onClose}>
        {t('languageSheet.cancel', { defaultValue: 'Cancel' })}
      </Button>
    </BottomSheet>
  );
}

/** The current language's own name — for the row that opens the sheet. */
export function currentLanguageLabel(): string {
  return LANGUAGE_ENDONYM[getAppLanguage() as SupportedLanguage] ?? '';
}
