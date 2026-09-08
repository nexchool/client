import React from 'react';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { PressScale } from '@/common/components/PressScale';

const SUPPORT_EMAIL = 'hello@nexchool.in';

/**
 * Clearance above the safe-area inset, sized to clear `AuthTrustFooter`'s
 * two-line block (shield + trust line, then copyright) rather than just
 * `spacing.lg` — on a device with a home indicator, the old offset put this
 * FAB directly on top of that text (reported against the owner's own
 * screenshot). Not itself a spacing-scale value: it is a measurement of a
 * sibling component's footprint, not a rhythm step.
 */
const FOOTER_CLEARANCE = 72;

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
          bottom: insets.bottom + FOOTER_CLEARANCE,
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
