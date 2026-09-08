import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

/**
 * Trust line + copyright below the card — admin-web's mobile equivalent of
 * the same two lines under its brand panel, unchanged in wording, just
 * themed through `palette.onSurfaceVariant`/`primary` instead of admin-web's
 * `text-muted-foreground`.
 */
export function AuthTrustFooter() {
  const { t } = useTranslation('auth');
  const { palette, spacing } = useTheme();
  const year = new Date().getFullYear();

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
    </View>
  );
}
