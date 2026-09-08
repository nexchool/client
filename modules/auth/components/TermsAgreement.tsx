import React from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

const TERMS_URL = 'https://nexchool.in/terms';
const PRIVACY_URL = 'https://nexchool.in/privacy';

/**
 * The terms/privacy line at the bottom of the card, under every method's
 * primary button — ported from admin-web's `LoginForm`
 * ("By signing in, you agree to our Terms of service · Privacy policy").
 *
 * The two links are nested `Text` elements with their own `onPress` (the
 * component forwards it straight to RN's `Text`, which natively supports
 * inline-pressable runs) rather than the shared `Link` component — `Link` is
 * built on `Pressable`, and a `View`-based component does not lay out as an
 * inline run inside a paragraph of `Text` the way nested `Text` does.
 *
 * `·` is hardcoded rather than translated — same as admin-web's own
 * separator — because it needs no translation. `prefix` and `suffix`,
 * though, are: English's verb ("agree") sits *before* the two linked nouns
 * and admin-web's sentence never closes after them, but Gujarati and Hindi
 * are subject-object-verb — the equivalent verb phrase has to land *after*
 * both links, which is exactly what `suffix` is for (empty in English,
 * where `prefix` already carries the verb). This prefix/link/·/link/suffix
 * slot order is the one that stays grammatical in all three
 * (see the `auth.json` file under each locale in `i18n/resources`).
 *
 * URLs duplicated locally rather than imported from a shared constant:
 * matches the existing pattern in `modules/profile/screens/*ProfileScreen.tsx`
 * and `app/(protected)/help-support.tsx`, none of which share a module for
 * these either.
 */
export function TermsAgreement() {
  const { t } = useTranslation('auth');
  const { spacing } = useTheme();

  return (
    <View style={{ marginTop: spacing[12] }}>
      <Text variant="labelSm" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
        {t('termsAgreementPrefix')}{' '}
        <Text variant="labelSm" color="primary" onPress={() => void Linking.openURL(TERMS_URL)}>
          {t('termsOfService')}
        </Text>
        {' · '}
        <Text variant="labelSm" color="primary" onPress={() => void Linking.openURL(PRIVACY_URL)}>
          {t('privacyPolicy')}
        </Text>
        {t('termsAgreementSuffix')}
      </Text>
    </View>
  );
}
