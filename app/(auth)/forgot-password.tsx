import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useForgotPassword } from '@/modules/auth/hooks/useForgotPassword';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation('auth');
  const { palette, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const { forgotPassword, loading, error, success } = useForgotPassword();

  const handleSubmit = async () => {
    setEmailError('');
    try {
      await forgotPassword(email);
    } catch (err: any) {
      if (err?.message?.includes('email')) {
        setEmailError(err.message);
      }
    }
  };

  return (
    <ScreenContainer>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.back}
      >
        <AppIcon name="chevron-back" size="lg" color="onSurface" />
      </Pressable>

      {success ? (
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
            {t('checkEmail', { defaultValue: 'Check your email' })}
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
            {t('checkEmailHelp', {
              defaultValue: "We've sent a password reset link to your email.",
            })}
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button variant="secondary" fullWidth onPress={() => router.replace('/(auth)/login')}>
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
            {t('resetTitle', { defaultValue: 'Reset your password' })}
          </Text>
          <Text
            variant="bodyMd"
            color="onSurfaceVariant"
            style={{ marginTop: spacing.xs }}
          >
            {t('resetSubtitle', {
              defaultValue: "Enter your email and we'll send you a reset link.",
            })}
          </Text>

          <View style={{ marginTop: spacing.xl }}>
            <Input
              label={t('email', { defaultValue: 'Email' })}
              value={email}
              onChangeText={setEmail}
              placeholder="you@school.edu"
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              error={emailError}
            />
          </View>

          {error && !emailError ? (
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
              {t('sendResetLink', { defaultValue: 'Send reset link' })}
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
