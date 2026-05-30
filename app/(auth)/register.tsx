import React, { useState } from 'react';
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
import { useRegister } from '@/modules/auth/hooks/useRegister';

export default function RegisterScreen() {
  const { t } = useTranslation('auth');
  const { spacing } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, loading, error } = useRegister();

  const handleRegister = async () => {
    setEmailError('');
    setPasswordError('');

    try {
      await register(email, password);
      router.push('/(auth)/login');
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('email')) {
        setEmailError(message);
      } else if (message.includes('password')) {
        setPasswordError(message);
      }
    }
  };

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
        {t('createAccount', { defaultValue: 'Create your account' })}
      </Text>
      <Text
        variant="bodyMd"
        color="onSurfaceVariant"
        style={{ textAlign: 'center', marginTop: spacing.xs }}
      >
        {t('registerSubtitle', {
          defaultValue: 'Sign up to get started with your account',
        })}
      </Text>

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
        />

        <Input
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete="password-new"
          autoCapitalize="none"
          error={passwordError}
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

      <View style={{ marginTop: spacing.lg }}>
        <Button variant="primary" fullWidth loading={loading} onPress={handleRegister}>
          {t('createAccountAction', { defaultValue: 'Create account' })}
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMd" color="onSurfaceVariant">
          {t('hasAccount', { defaultValue: 'Already have an account? ' })}
        </Text>
        <Link onPress={() => router.push('/(auth)/login')}>{t('signIn')}</Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 32 },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingBottom: 32,
  },
});
