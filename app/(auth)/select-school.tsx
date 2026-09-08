import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Text } from '@/common/components/Text';
import { Logo } from '@/common/components/Logo';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { useSelectSchool } from '@/modules/auth/hooks/useSelectSchool';

/**
 * The fallback for a build with no school baked in (the general Nexchool
 * app — see `config/appConfig.ts#getBakedTenant`). `app/index.tsx` sends a
 * signed-out cold start here instead of straight to `login` whenever no
 * tenant is known yet, because `login` cannot be branded or offer the
 * school's sign-in methods without one.
 *
 * A school-specific build never sees this screen: `seedBakedTenant` has
 * already stored its tenant before `app/index.tsx` makes this decision.
 */
export default function SelectSchoolScreen() {
  const { t } = useTranslation('auth');
  const { spacing } = useTheme();
  const [subdomain, setSubdomain] = useState('');
  const { selectSchool, loading, error } = useSelectSchool();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Logo size="lg" />
      </View>

      <Text
        variant="display"
        color="onSurface"
        style={{ textAlign: 'center', marginTop: spacing.xl }}
      >
        {t('selectSchoolTitle')}
      </Text>
      <Text
        variant="bodyMd"
        color="onSurfaceVariant"
        style={{ textAlign: 'center', marginTop: spacing.xs }}
      >
        {t('selectSchoolSubtitle')}
      </Text>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Input
          label={t('schoolSubdomainLabel')}
          placeholder={t('schoolSubdomainPlaceholder')}
          value={subdomain}
          onChangeText={setSubdomain}
          autoComplete="off"
          autoCapitalize="none"
          error={error ?? undefined}
        />
      </View>

      <View style={{ marginTop: spacing.lg, paddingBottom: 32 }}>
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          onPress={() => selectSchool(subdomain)}
        >
          {t('continueButton')}
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 32 },
});
