import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Input } from '@/common/components/Input';
import { Link } from '@/common/components/Link';
import { AuthPrimaryButton } from '@/modules/auth/components/AuthPrimaryButton';
import { TermsAgreement } from '@/modules/auth/components/TermsAgreement';
import { useLogin } from '@/modules/auth/hooks/useLogin';
import { isLoginFieldError } from '@/modules/auth/errors/LoginFieldError';

type Props = {
  wasSessionExpired: boolean;
  /** Present only where this school also publishes `mobile_otp`. */
  onUseOtp?: () => void;
  /** Present only where this school also publishes `mobile_pin`. */
  onUsePin?: () => void;
};

/**
 * Email and password — the home screen whenever a school offers it, which
 * every staff account does. Links out to whichever other methods this
 * school also publishes; a method it has not enabled gets no link, because
 * the server refuses it anyway and offering it would just be a dead end.
 */
export function EmailPasswordForm({ wasSessionExpired, onUseOtp, onUsePin }: Props) {
  const { t } = useTranslation('auth');
  const { spacing, palette, radius, iconSize } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading, error } = useLogin();

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (isLoginFieldError(err)) {
        if (err.field === 'email') {
          setEmailError(err.message);
        } else {
          setPasswordError(err.message);
        }
      }
    }
  };

  return (
    <View>
      <Text
        variant="display"
        color="onSurface"
        style={{ textAlign: 'center', marginTop: spacing.xl }}
      >
        {t('welcomeBack')}
      </Text>
      <Text
        variant="bodyMd"
        color="onSurfaceVariant"
        style={{ textAlign: 'center', marginTop: spacing.xs }}
      >
        {t('signInSubtitle')}
      </Text>

      {wasSessionExpired ? (
        <View
          style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: palette.errorContainer,
          }}
        >
          <Text variant="bodyMd" color="onErrorContainer" style={{ textAlign: 'center' }}>
            {t('sessionExpired', {
              defaultValue: 'Your session has expired. Please sign in again.',
            })}
          </Text>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Input
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          autoCapitalize="none"
          error={emailError}
          leftIcon={<Ionicons name="mail-outline" size={iconSize.md} color={palette.onSurfaceVariant} />}
        />

        <Input
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="password"
          autoCapitalize="none"
          error={passwordError}
          leftIcon={<Ionicons name="lock-closed-outline" size={iconSize.md} color={palette.onSurfaceVariant} />}
          labelRight={
            <Link onPress={() => router.push('/(auth)/forgot-password')}>
              {t('forgotPassword')}
            </Link>
          }
          rightSlot={
            <Link onPress={() => setShowPassword((s) => !s)}>
              {showPassword
                ? t('hide', { defaultValue: 'Hide' })
                : t('show', { defaultValue: 'Show' })}
            </Link>
          }
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

      {/*
        No sign-up link: schools issue credentials, and the self-service
        register endpoint this used to point at has been deleted from the
        server.
      */}
      <View style={{ marginTop: spacing.lg, paddingBottom: 32, gap: spacing.md }}>
        <AuthPrimaryButton fullWidth loading={loading} onPress={handleLogin}>
          {t('signIn')}
        </AuthPrimaryButton>

        {onUseOtp ? (
          <View style={{ alignItems: 'center' }}>
            <Link onPress={onUseOtp}>{t('signInWithOtp')}</Link>
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
