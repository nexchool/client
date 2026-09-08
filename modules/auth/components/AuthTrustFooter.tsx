import React from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

const SUPPORT_EMAIL = 'hello@nexchool.in';

/**
 * Trust line + copyright below the card — admin-web's mobile equivalent of
 * the same two lines under its brand panel, unchanged in wording, just
 * themed through `palette.onSurfaceVariant`/`primary` instead of admin-web's
 * `text-muted-foreground`.
 *
 * The "Need help?" line below the copyright is where the support shortcut
 * lives now — it used to be a floating action button (`SupportFab`, deleted).
 * A FAB is a pattern for a scrolling content surface that needs a
 * persistently-reachable action; this is a fixed-height auth screen where the
 * card already fills the viewport and this footer occupies the remaining
 * band, so there was never a spot for a circle to float without landing on
 * top of the card or this text. Three attempts at offsets proved the geometry
 * has no solution — the fix belongs in the layout, not in another offset, so
 * the affordance moved into the one place that was already reserving room for
 * itself: this footer.
 *
 * `SUPPORT_EMAIL` duplicated locally rather than imported: matches the
 * existing local constant in `app/(protected)/help-support.tsx`, which has no
 * shared module for it either (the same pattern `SupportFab` used).
 */
export function AuthTrustFooter() {
  const { t } = useTranslation('auth');
  const { palette, spacing } = useTheme();
  const year = new Date().getFullYear();

  const handleContactSupport = () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('supportEmailSubject'))}`;
    void Linking.openURL(url);
  };

  return (
    <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="shield-checkmark-outline" size={14} color={palette.primary} />
        <Text variant="labelSm" color="onSurfaceVariant">
          {t('trustLine')}
        </Text>
      </View>
      <Text variant="labelSm" color="onSurfaceVariant">
        {t('copyright', { year })}
      </Text>
      <Text
        variant="labelSm"
        color="primary"
        onPress={handleContactSupport}
        accessibilityRole="button"
        accessibilityLabel={t('contactSupport')}
      >
        {t('needHelp')}
      </Text>
    </View>
  );
}
