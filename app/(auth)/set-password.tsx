import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Text } from '@/common/components/Text';
import { Logo } from '@/common/components/Logo';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useForceResetPassword } from '@/modules/auth/hooks/useForceResetPassword';

/** The server's rule for this endpoint (`_is_password_strong`). */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Mandatory password change for an account whose password its school chose.
 *
 * Nobody asks for this screen — it appears between signing in and the app, so
 * it has to say why it is here. The server refuses every endpoint outside the
 * password-reset allowlist while the flag is set, which makes this the only
 * screen a provisioned teacher can use until they finish it.
 */
export default function SetPasswordScreen() {
  const { t } = useTranslation('auth');
  const { spacing } = useTheme();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const { isAuthenticated, isLoading, clearMustResetPassword, logout } = useAuth();
  const { setNewPassword, loading, error } = useForceResetPassword();

  // The endpoint authenticates with the current session, so there is nothing to
  // do here without one — a deep link or a sign-out mid-flow lands on login.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  const handleSubmit = async () => {
    setPasswordError('');
    setConfirmError('');

    // Checked here as well as on the server so a weak password is named on the
    // field rather than coming back as a 422 the user has to interpret.
    if (password.length < MIN_PASSWORD_LENGTH || !/\d/.test(password)) {
      setPasswordError(t('passwordRule', { defaultValue: '8+ characters, one number' }));
      return;
    }
    if (password !== confirm) {
      setConfirmError(t('passwordsDontMatch', { defaultValue: 'Passwords do not match' }));
      return;
    }

    try {
      await setNewPassword(password);
      // The server has cleared the flag; clearing it locally is what releases
      // the protected layout, which would otherwise bounce straight back here.
      await clearMustResetPassword();
      router.replace('/(protected)/home');
    } catch {
      // Surfaced by the hook's `error` below — including the weak-password 422,
      // whose message names the rule.
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Logo size="lg" />
      </View>

      <Text
        variant="headlineLg"
        color="onSurface"
        style={{ textAlign: 'center', marginTop: spacing.xl }}
      >
        {t('setPasswordTitle', { defaultValue: 'Set your password' })}
      </Text>
      <Text
        variant="bodyMd"
        color="onSurfaceVariant"
        style={{ textAlign: 'center', marginTop: spacing.xs }}
      >
        {t('setPasswordHelp', {
          defaultValue:
            'Your school issued the password you just signed in with. Choose your own to continue.',
        })}
      </Text>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Input
          label={t('newPassword', { defaultValue: 'New password' })}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          autoCapitalize="none"
          error={passwordError}
          helper={t('passwordRule', { defaultValue: '8+ characters, one number' })}
          rightSlot={
            <Link onPress={() => setShowPassword((s) => !s)}>
              {showPassword
                ? t('hide', { defaultValue: 'Hide' })
                : t('show', { defaultValue: 'Show' })}
            </Link>
          }
        />
        <Input
          label={t('confirmPassword', { defaultValue: 'Confirm password' })}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          autoCapitalize="none"
          error={confirmError}
        />
      </View>

      {error && !passwordError && !confirmError ? (
        <Text
          variant="bodyMd"
          color="error"
          style={{ textAlign: 'center', marginTop: spacing.sm }}
        >
          {error}
        </Text>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <Button variant="primary" fullWidth loading={loading} onPress={handleSubmit}>
          {t('setPasswordAction', { defaultValue: 'Set password' })}
        </Button>
      </View>

      {/*
        There is no back button and no drawer from here, so without this the
        only way off the screen is finishing it. Someone signed in as the wrong
        person — a shared staff phone — needs a way out, and signing out is one
        of the four things the server still allows.
      */}
      <View style={styles.footer}>
        <Link onPress={handleSignOut}>
          {t('setPasswordSignOut', { defaultValue: 'Sign in as someone else' })}
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 32 },
  footer: { marginTop: 24, alignItems: 'center', paddingBottom: 32 },
});
