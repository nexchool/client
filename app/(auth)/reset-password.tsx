import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useResetPassword } from '@/modules/auth/hooks/useResetPassword';

export default function ResetPasswordScreen() {
  const { t } = useTranslation('auth');
  const { palette, spacing } = useTheme();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const token = params.token || '';
  const email = params.email || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { resetPassword, loading, error } = useResetPassword();

  useEffect(() => {
    if (!token || !email) {
      router.replace('/(auth)/forgot-password');
    }
  }, [token, email]);

  const handleSubmit = async () => {
    setPasswordError('');
    setConfirmError('');
    if (password.length < 8) {
      setPasswordError(t('passwordRule', { defaultValue: '8+ characters, one number' }));
      return;
    }
    if (password !== confirm) {
      setConfirmError(t('passwordsDontMatch', { defaultValue: 'Passwords do not match' }));
      return;
    }
    try {
      await resetPassword(email, token, password, confirm);
      setSubmitted(true);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('match')) {
        setConfirmError(message);
      } else if (message.includes('password')) {
        setPasswordError(message);
      }
    }
  };

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <AppIcon name="chevron-back" size="lg" color="onSurface" />
      </Pressable>

      {submitted ? (
        <View style={{ alignItems: 'center', marginTop: spacing.xl * 2 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${palette.success}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="checkmark" size="xl" color="success" />
          </View>
          <Text
            variant="headlineMd"
            color="onSurface"
            style={{ marginTop: spacing.lg, textAlign: 'center' }}
          >
            {t('passwordUpdated', { defaultValue: 'Password updated' })}
          </Text>
          <Text
            variant="bodyMd"
            color="onSurfaceVariant"
            style={{
              marginTop: spacing.sm,
              textAlign: 'center',
              paddingHorizontal: spacing.lg,
            }}
          >
            {t('passwordUpdatedHelp', {
              defaultValue: 'Sign in with your new password to continue.',
            })}
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button variant="primary" fullWidth onPress={() => router.replace('/(auth)/login')}>
              {t('backToSignIn', { defaultValue: 'Back to sign in' })}
            </Button>
          </View>
        </View>
      ) : (
        <>
          <Text
            variant="headlineLg"
            color="onSurface"
            style={{ marginTop: spacing.xl }}
          >
            {t('createNewPassword', { defaultValue: 'Create new password' })}
          </Text>
          <Text
            variant="bodyMd"
            color="onSurfaceVariant"
            style={{ marginTop: spacing.xs }}
          >
            {t('createNewPasswordHelp', {
              defaultValue: 'Choose a strong password you have not used before.',
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
              style={{ marginTop: spacing.sm, textAlign: 'center' }}
            >
              {error}
            </Text>
          ) : null}

          <View style={{ marginTop: spacing.lg }}>
            <Button variant="primary" fullWidth loading={loading} onPress={handleSubmit}>
              {t('updatePassword', { defaultValue: 'Update password' })}
            </Button>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, justifyContent: 'center' },
});
