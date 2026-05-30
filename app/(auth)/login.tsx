import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Text } from '@/common/components/Text';
import { Logo } from '@/common/components/Logo';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { useLogin } from '@/modules/auth/hooks/useLogin';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { isLoginFieldError } from '@/modules/auth/errors/LoginFieldError';

export default function LoginScreen() {
  const { t } = useTranslation('auth');
  const { palette, spacing } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [choosingTenant, setChoosingTenant] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading, error } = useLogin();
  const {
    isAuthenticated,
    pendingTenantChoice,
    loginWithTenant,
    clearPendingTenantChoice,
  } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(protected)/home');
    }
  }, [isAuthenticated]);

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

  const handleChooseSchool = async (tenantId: string) => {
    setChoosingTenant(true);
    try {
      await loginWithTenant(tenantId);
      router.replace('/(protected)/home');
    } catch {
      // Error surfaced by auth context
    } finally {
      setChoosingTenant(false);
    }
  };

  // Tenant-choice sub-state — preserves existing multi-tenant flow.
  if (pendingTenantChoice?.tenants?.length) {
    return (
      <ScreenContainer>
        <View style={{ paddingTop: spacing.xl }}>
          <Text variant="headlineLg" color="onSurface">
            {t('whichSchool')}
          </Text>
          <Text
            variant="bodyMd"
            color="onSurfaceVariant"
            style={{ marginTop: spacing.xs }}
          >
            {t('tenantSubtitle')}
          </Text>

          <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
            <Link onPress={clearPendingTenantChoice}>{t('backToLogin')}</Link>
          </View>

          {choosingTenant ? (
            <ActivityIndicator
              size="large"
              color={palette.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {pendingTenantChoice.tenants.map((tenant) => (
                <Pressable
                  key={tenant.id}
                  onPress={() => handleChooseSchool(tenant.id)}
                  accessibilityRole="button"
                  accessibilityLabel={tenant.name}
                  style={({ pressed }) => [
                    {
                      backgroundColor: palette.surfaceContainerLowest,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: palette.outlineVariant,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text variant="bodyLg" color="onSurface">
                    {tenant.name}
                  </Text>
                  {tenant.subdomain ? (
                    <Text
                      variant="labelSm"
                      color="onSurfaceVariant"
                      style={{ marginTop: spacing.xs }}
                    >
                      {tenant.subdomain}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

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
        {t('welcomeBack')}
      </Text>
      <Text
        variant="bodyMd"
        color="onSurfaceVariant"
        style={{ textAlign: 'center', marginTop: spacing.xs }}
      >
        {t('signInSubtitle')}
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
          autoComplete="password"
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

        <View style={{ alignItems: 'flex-end' }}>
          <Link onPress={() => router.push('/(auth)/forgot-password')}>
            {t('forgotPassword')}
          </Link>
        </View>
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
        <Button variant="primary" fullWidth loading={loading} onPress={handleLogin}>
          {t('signIn')}
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodyMd" color="onSurfaceVariant">
          {t('noAccountPrefix')}{' '}
        </Text>
        <Link onPress={() => router.push('/(auth)/register')}>{t('signUp')}</Link>
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
