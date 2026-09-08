import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Input } from '@/common/components/Input';
import { Link } from '@/common/components/Link';
import { AuthPrimaryButton } from '@/modules/auth/components/AuthPrimaryButton';
import { PasswordVisibilityToggle } from '@/modules/auth/components/PasswordVisibilityToggle';
import { TermsAgreement } from '@/modules/auth/components/TermsAgreement';
import { PIN_LENGTH, useMobilePinLogin } from '@/modules/auth/hooks/useMobilePinLogin';
import { isLoginFieldError } from '@/modules/auth/errors/LoginFieldError';

type Props = {
  /** Return to the email form. Omitted where this school offers no email
   * sign-in — there is then nothing to go back to, and pin *is* the home
   * screen. */
  onBack?: () => void;
  /** Switch to the mobile-code form instead, where this school offers both
   * and email is not one of them. */
  onUseOtp?: () => void;
};

/**
 * Signing in with a mobile number and a PIN.
 *
 * One step, unlike the code form: nothing has to be sent and nothing has to
 * arrive, which is the whole point of the method — a student on a bus with no
 * signal can still sign in.
 *
 * Only reachable where the school's authentication policy publishes the
 * method (`usePublishedAuthMethods`), and the server refuses it otherwise, so
 * this hides an option rather than enforcing a rule.
 */
export function MobilePinForm({ onBack, onUseOtp }: Props) {
  const { t } = useTranslation('auth');
  const { spacing, palette, radius, iconSize } = useTheme();

  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const { signIn, loading, error } = useMobilePinLogin();

  const handleSubmit = async () => {
    setMobileError('');
    setPinError('');

    try {
      await signIn(mobile, pin);
    } catch (err: unknown) {
      if (isLoginFieldError(err)) {
        if (err.field === 'mobile') {
          setMobileError(err.message);
        } else {
          setPinError(err.message);
        }
      }
    }
  };

  return (
    <View>
      <Text
        variant="display"
        color="onSurface"
        style={{ textAlign: 'center' }}
      >
        {t('welcomeBack')}
      </Text>
      <Text
        variant="bodyMd"
        color="onSurfaceVariant"
        style={{ textAlign: 'center', marginTop: spacing[6] }}
      >
        {t('pinSubtitle')}
      </Text>

      <View style={{ marginTop: spacing.lg }}>
        <Input
          label={t('mobileLabel')}
          placeholder={t('mobilePlaceholder')}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          autoComplete="tel"
          autoCapitalize="none"
          error={mobileError}
          leftIcon={<Ionicons name="call-outline" size={iconSize.md} color={palette.onSurfaceVariant} />}
          variant="filled"
          cornerRadius={radius[14]}
          labelGap={spacing[6]}
        />

        <Input
          label={t('pinLabel')}
          placeholder={t('pinPlaceholder')}
          value={pin}
          // Digits only, capped at the length a PIN is — the component takes
          // no maxLength, and doing it here also strips anything a keyboard
          // with punctuation would otherwise let through.
          onChangeText={(value) =>
            setPin(value.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH))
          }
          keyboardType="number-pad"
          secureTextEntry={!showPin}
          autoComplete="off"
          autoCapitalize="none"
          error={pinError}
          leftIcon={<Ionicons name="lock-closed-outline" size={iconSize.md} color={palette.onSurfaceVariant} />}
          variant="filled"
          cornerRadius={radius[14]}
          labelGap={spacing[6]}
          rightSlot={<PasswordVisibilityToggle visible={showPin} onToggle={() => setShowPin((s) => !s)} />}
        />
      </View>

      {error ? (
        <Text
          variant="bodyMd"
          color="error"
          style={{ textAlign: 'center', marginTop: spacing.md }}
        >
          {error}
        </Text>
      ) : null}

      <View style={{ marginTop: spacing[10], paddingBottom: spacing.xl, gap: spacing.sm }}>
        <AuthPrimaryButton fullWidth loading={loading} onPress={handleSubmit}>
          {t('signIn')}
        </AuthPrimaryButton>

        {onBack ? (
          <View style={{ alignItems: 'center' }}>
            <Link onPress={onBack}>{t('signInWithEmail')}</Link>
          </View>
        ) : null}

        {onUseOtp ? (
          <View style={{ alignItems: 'center' }}>
            <Link onPress={onUseOtp}>{t('signInWithOtp')}</Link>
          </View>
        ) : null}

        <TermsAgreement />
      </View>
    </View>
  );
}
