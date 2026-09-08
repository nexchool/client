import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Input } from '@/common/components/Input';
import { Link } from '@/common/components/Link';
import { AuthErrorBanner } from '@/modules/auth/components/AuthErrorBanner';
import { AuthPrimaryButton } from '@/modules/auth/components/AuthPrimaryButton';
import { TermsAgreement } from '@/modules/auth/components/TermsAgreement';
import { OTP_LENGTH, useMobileOtpLogin } from '@/modules/auth/hooks/useMobileOtpLogin';
import { isLoginFieldError } from '@/modules/auth/errors/LoginFieldError';

type Props = {
  /** Return to the email form. Omitted where this school offers no email
   * sign-in — there is then nothing to go back to, and this form *is* the
   * home screen. */
  onBack?: () => void;
  /** Switch to the mobile-PIN form instead, where this school offers both
   * and email is not one of them. */
  onUsePin?: () => void;
};

type Step = 'mobile' | 'code';

/**
 * Signing in with a code sent to a phone.
 *
 * Two steps, unlike `MobilePinForm`'s one: a code has to be asked for before
 * it can be checked. The wording on the code step is deliberately
 * conditional ("if that number can sign in here") rather than a plain
 * confirmation — see `useMobileOtpLogin` and the server's `otp.py` — because
 * saying it plainly would answer, for free, whether a given number belongs to
 * anybody at this school.
 *
 * Only reachable where the school's authentication policy publishes
 * `mobile_otp` (`usePublishedAuthMethods`), and the server refuses it
 * otherwise, so this hides an option rather than enforcing a rule.
 */
export function MobileOtpForm({ onBack, onUsePin }: Props) {
  const { t } = useTranslation('auth');
  const { spacing, palette, radius, iconSize } = useTheme();

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | undefined>();
  const [mobileError, setMobileError] = useState('');
  const [codeError, setCodeError] = useState('');

  const { requestCode, verifyCode, requestLoading, verifyLoading, error } =
    useMobileOtpLogin();

  const handleRequestCode = async () => {
    setMobileError('');
    try {
      const id = await requestCode(mobile);
      // No challenge id means the server declined to say why — that is the
      // designed answer, not a failure, so the form advances regardless.
      setChallengeId(id);
      setStep('code');
    } catch (err: unknown) {
      if (isLoginFieldError(err)) {
        setMobileError(err.message);
      }
      // A genuine request failure (offline, server error) is surfaced by
      // `error` below rather than advancing the step.
    }
  };

  const handleVerifyCode = async () => {
    setCodeError('');
    try {
      await verifyCode(mobile, code, challengeId);
    } catch (err: unknown) {
      if (isLoginFieldError(err)) {
        setCodeError(err.message);
      }
    }
  };

  if (step === 'mobile') {
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
          {t('otpSubtitle')}
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
        </View>

        {error ? <AuthErrorBanner message={error} style={{ marginTop: spacing.md }} /> : null}

        <View style={{ marginTop: spacing[10], gap: spacing.sm }}>
          <AuthPrimaryButton fullWidth loading={requestLoading} onPress={handleRequestCode}>
            {t('sendCode')}
          </AuthPrimaryButton>

          {onBack ? (
            <View style={{ alignItems: 'center' }}>
              <Link onPress={onBack}>{t('signInWithEmail')}</Link>
            </View>
          ) : null}

          {onUsePin ? (
            <View style={{ alignItems: 'center' }}>
              <Link onPress={onUsePin}>{t('signInWithPin')}</Link>
            </View>
          ) : null}

          <TermsAgreement />
        </View>
      </View>
    );
  }

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
        {t('otpSentHelp')}
      </Text>

      <View style={{ marginTop: spacing.lg }}>
        <Input
          label={t('otpLabel')}
          placeholder={t('otpPlaceholder')}
          value={code}
          onChangeText={(value) =>
            setCode(value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))
          }
          keyboardType="number-pad"
          autoComplete="one-time-code"
          autoCapitalize="none"
          error={codeError}
          leftIcon={<Ionicons name="keypad-outline" size={iconSize.md} color={palette.onSurfaceVariant} />}
          variant="filled"
          cornerRadius={radius[14]}
          labelGap={spacing[6]}
        />
      </View>

      {error ? <AuthErrorBanner message={error} style={{ marginTop: spacing.md }} /> : null}

      <View style={{ marginTop: spacing[10], gap: spacing.sm }}>
        <AuthPrimaryButton fullWidth loading={verifyLoading} onPress={handleVerifyCode}>
          {t('signIn')}
        </AuthPrimaryButton>

        <View style={{ alignItems: 'center' }}>
          <Link
            onPress={() => {
              setStep('mobile');
              setCode('');
              setCodeError('');
            }}
          >
            {t('useAnotherNumber')}
          </Link>
        </View>

        <TermsAgreement />
      </View>
    </View>
  );
}
