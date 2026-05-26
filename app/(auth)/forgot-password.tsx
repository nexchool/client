import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useForgotPassword } from '@/modules/auth/hooks/useForgotPassword';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation('auth');
  const { palette, spacing, typography } = useTheme();
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
        <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
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
            <Ionicons name="checkmark" size={36} color={palette.success} />
          </View>
          <Text
            style={[
              typography.headlineMd,
              { color: palette.onSurface, marginTop: spacing.lg, textAlign: 'center' },
            ]}
          >
            {t('checkEmail', { defaultValue: 'Check your email' })}
          </Text>
          <Text
            style={[
              typography.bodyMd,
              {
                color: palette.onSurfaceVariant,
                marginTop: spacing.sm,
                textAlign: 'center',
                paddingHorizontal: spacing.lg,
              },
            ]}
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
            style={[
              typography.headlineLg,
              { color: palette.onSurface, marginTop: spacing.xl },
            ]}
          >
            {t('resetTitle', { defaultValue: 'Reset your password' })}
          </Text>
          <Text
            style={[
              typography.bodyMd,
              { color: palette.onSurfaceVariant, marginTop: spacing.xs },
            ]}
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
              style={[
                typography.bodyMd,
                { color: palette.error, marginTop: spacing.sm, textAlign: 'center' },
              ]}
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
