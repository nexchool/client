import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Logo } from '@/common/components/Logo';
import { Button } from '@/common/components/Button';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthContext } from '@/modules/auth/context/AuthContext';

type VerificationStatus = 'processing' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const { t } = useTranslation('auth');
  const { palette, spacing, typography } = useTheme();
  const params = useLocalSearchParams();

  // URL params from backend redirect (preserved deep-link callback contract)
  const status = (params.status as string) || '';
  const accessToken = (params.access_token as string) || '';
  const refreshToken = (params.refresh_token as string) || '';
  const userId = (params.user_id as string) || '';
  const email = (params.email as string) || '';
  const errorMessage = (params.error as string) || '';

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('processing');
  const [error, setError] = useState<string | null>(null);
  const { setAuthData } = useAuthContext();

  useEffect(() => {
    const processVerification = async () => {
      if (status === 'error') {
        setError(decodeURIComponent(errorMessage));
        setVerificationStatus('error');
        return;
      }

      if (status === 'success' && accessToken && refreshToken) {
        try {
          await setAuthData({
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
              id: parseInt(userId) || 0,
              email,
              name: email.split('@')[0],
              email_verified: true,
            },
            permissions: [],
          });
          setVerificationStatus('success');
        } catch {
          setError(
            t('verifyLoginFailed', { defaultValue: 'Failed to complete login' }),
          );
          setVerificationStatus('error');
        }
        return;
      }

      setError(
        t('verifyInvalidLink', { defaultValue: 'Invalid verification link' }),
      );
      setVerificationStatus('error');
    };

    processVerification();
  }, [
    status,
    accessToken,
    refreshToken,
    userId,
    email,
    errorMessage,
    setAuthData,
    t,
  ]);

  if (verificationStatus === 'processing') {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Logo size="lg" />
          <ActivityIndicator
            size="large"
            color={palette.primary}
            style={{ marginTop: spacing.xl }}
          />
          <Text
            style={[
              typography.headlineMd,
              { color: palette.onSurface, marginTop: spacing.lg, textAlign: 'center' },
            ]}
          >
            {t('verifyProcessingTitle', { defaultValue: 'Completing verification' })}
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
            {t('verifyProcessingHelp', {
              defaultValue: 'Please wait while we complete your email verification.',
            })}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
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
              typography.headlineLg,
              { color: palette.onSurface, marginTop: spacing.lg, textAlign: 'center' },
            ]}
          >
            {t('verifySuccessTitle', { defaultValue: 'Email verified' })}
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
            {t('verifySuccessHelp', {
              defaultValue: "You're signed in and ready to go.",
            })}
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button
              variant="primary"
              fullWidth
              onPress={() => router.replace('/(protected)/home')}
            >
              {t('continueToHome', { defaultValue: 'Continue to home' })}
            </Button>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.centered}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: `${palette.error}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={36} color={palette.error} />
        </View>
        <Text
          style={[
            typography.headlineLg,
            { color: palette.onSurface, marginTop: spacing.lg, textAlign: 'center' },
          ]}
        >
          {t('verifyFailedTitle', { defaultValue: 'Verification failed' })}
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
          {error ||
            t('verifyFailedHelp', {
              defaultValue:
                'The verification link is invalid or has expired. Try registering again or request a new email.',
            })}
        </Text>
        <View style={{ marginTop: spacing.xl, width: '100%', gap: spacing.sm }}>
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          >
            {t('goToLogin', { defaultValue: 'Go to sign in' })}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/(auth)/register')}
          >
            {t('registerAgain', { defaultValue: 'Register again' })}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
