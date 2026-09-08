import React from 'react';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { PressScale } from '@/common/components/PressScale';

const SUPPORT_EMAIL = 'hello@nexchool.in';

/**
 * Circular support shortcut, bottom-right — admin-web's `<a href="mailto:">`
 * FAB, ported to a `Pressable` opening the same mailto link via `Linking`.
 * Rendered as a sibling of `ScreenContainer` (absolutely positioned) rather
 * than inside its ScrollView, so it stays fixed to the viewport instead of
 * scrolling away with the form. Offset by `useSafeAreaInsets` (the same
 * pattern `Toast.tsx` uses) rather than `ScreenContainer`'s own bottom
 * inset — this sits outside that container, as its sibling, precisely so it
 * does not scroll away with it.
 *
 * The bottom offset is a plain `spacing.sm` — a standard small FAB margin —
 * rather than a measurement of `AuthTrustFooter`'s height. That earlier
 * approach (a hardcoded clearance sized to clear the footer) sized this FAB
 * for the footer and, on a short device, still landed it on top of the
 * card's own bottom-right corner instead: the card and footer sit close
 * enough to the bottom of a 375x812 viewport that no single fixed offset
 * clears both from the same spot. The fix belongs on the content side, not
 * here — `app/(auth)/login.tsx` gives the scrollable card+footer column a
 * bottom padding that clears this FAB's footprint, so this component only
 * has to say "hug the corner," never "leave room for a sibling."
 *
 * `SUPPORT_EMAIL` duplicated locally rather than imported: matches the
 * existing local constant in `app/(protected)/help-support.tsx`, which has
 * no shared module for it either.
 */
export function SupportFab() {
  const { t } = useTranslation('auth');
  const { palette, spacing, elevation } = useTheme();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('supportEmailSubject'))}`;
    void Linking.openURL(url);
  };

  return (
    <PressScale
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t('contactSupport')}
      style={[
        {
          position: 'absolute',
          bottom: insets.bottom + spacing.sm,
          right: insets.right + spacing.lg,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: palette.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        elevation.modal,
      ]}
    >
      <Ionicons name="help-buoy-outline" size={22} color={palette.onPrimary} />
    </PressScale>
  );
}
