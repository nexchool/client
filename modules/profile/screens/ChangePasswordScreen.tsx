import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Input } from '@/common/components/Input';
import { Button } from '@/common/components/Button';
import { Link } from '@/common/components/Link';
import { changePassword } from '@/modules/auth/services/authService';
import { ApiException } from '@/common/services/api';

type StrengthScore = 0 | 1 | 2 | 3 | 4;

function passwordStrength(p: string): {
  score: StrengthScore;
  rules: { length: boolean; digit: boolean; letter: boolean; symbol: boolean };
} {
  const rules = {
    length: p.length >= 8,
    digit: /\d/.test(p),
    letter: /[a-zA-Z]/.test(p),
    symbol: /[^a-zA-Z0-9]/.test(p),
  };
  const score = Object.values(rules).filter(Boolean).length as StrengthScore;
  return { score, rules };
}

export default function ChangePasswordScreen() {
  const { t } = useTranslation('profile');
  const { palette, spacing, typography } = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentErr, setCurrentErr] = useState('');
  const [nextErr, setNextErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const strength = passwordStrength(next);

  const handleSubmit = async () => {
    setCurrentErr('');
    setNextErr('');
    setConfirmErr('');

    if (!current) {
      setCurrentErr(
        t('changePassword.errors.currentRequired', {
          defaultValue: 'Enter your current password',
        }),
      );
      return;
    }
    if (next !== confirm) {
      setConfirmErr(
        t('changePassword.errors.mismatch', {
          defaultValue: 'Passwords do not match',
        }),
      );
      return;
    }
    if (!strength.rules.length || !strength.rules.digit) {
      setNextErr(
        t('changePassword.passwordRule', {
          defaultValue: '8+ characters, one number',
        }),
      );
      return;
    }
    if (next === current) {
      setNextErr(
        t('changePassword.errors.same', {
          defaultValue: 'New password must differ from current',
        }),
      );
      return;
    }

    setLoading(true);
    try {
      await changePassword({ current_password: current, new_password: next });
      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        const data = err.data as
          | { error?: { code?: string } | string }
          | undefined;
        const errField = data?.error;
        const code =
          (typeof errField === 'object' && errField?.code) ||
          (typeof errField === 'string' ? errField : '') ||
          '';
        if (code === 'current_password_invalid') {
          setCurrentErr(
            t('changePassword.errors.currentInvalid', {
              defaultValue: "Current password doesn't match",
            }),
          );
        } else if (code === 'password_weak') {
          setNextErr(
            t('changePassword.errors.weak', {
              defaultValue: 'Password is too weak',
            }),
          );
        } else if (code === 'password_unchanged') {
          setNextErr(
            t('changePassword.errors.same', {
              defaultValue: 'New password must differ from current',
            }),
          );
        } else {
          setNextErr(
            t('changePassword.errors.unknown', {
              defaultValue: 'Could not update password',
            }),
          );
        }
      } else {
        setNextErr(
          t('changePassword.errors.unknown', {
            defaultValue: 'Could not update password',
          }),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ScreenContainer>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ width: 44, height: 44, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
        </Pressable>
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
              {
                color: palette.onSurface,
                marginTop: spacing.lg,
                textAlign: 'center',
              },
            ]}
          >
            {t('changePassword.successTitle', { defaultValue: 'Password updated' })}
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
            {t('changePassword.successBody', {
              defaultValue: 'Use your new password from now on.',
            })}
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button variant="primary" fullWidth onPress={() => router.back()}>
              {t('changePassword.backToProfile', {
                defaultValue: 'Back to profile',
              })}
            </Button>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ width: 44, height: 44, justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
      </Pressable>

      <Text
        style={[
          typography.headlineLg,
          { color: palette.onSurface, marginTop: spacing.md },
        ]}
      >
        {t('changePassword.title', { defaultValue: 'Change password' })}
      </Text>
      <Text
        style={[
          typography.bodyMd,
          { color: palette.onSurfaceVariant, marginTop: spacing.xs },
        ]}
      >
        {t('changePassword.subtitle', {
          defaultValue: "Choose a strong password you haven't used before",
        })}
      </Text>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Input
          label={t('changePassword.currentLabel', {
            defaultValue: 'Current password',
          })}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          autoCapitalize="none"
          error={currentErr}
          rightSlot={
            <Link onPress={() => setShowPassword((s) => !s)}>
              {showPassword
                ? t('changePassword.hide', { defaultValue: 'Hide' })
                : t('changePassword.show', { defaultValue: 'Show' })}
            </Link>
          }
        />
        <Input
          label={t('changePassword.newLabel', { defaultValue: 'New password' })}
          value={next}
          onChangeText={setNext}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          autoCapitalize="none"
          error={nextErr}
          helper={t('changePassword.passwordRule', {
            defaultValue: '8+ characters, one number',
          })}
        />
        {next.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: -spacing.xs }}>
            {[0, 1, 2, 3].map((i) => {
              // Server rule is length>=8 AND has digit. Meter colors must
              // not say "warning" for a password that the server will accept.
              const meetsServer = strength.rules.length && strength.rules.digit;
              const filled = i < strength.score;
              const activeColor = meetsServer
                ? palette.success
                : strength.score >= 2
                ? palette.warning
                : palette.error;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: filled ? activeColor : palette.surfaceContainerHigh,
                  }}
                />
              );
            })}
          </View>
        ) : null}
        <Input
          label={t('changePassword.confirmLabel', {
            defaultValue: 'Confirm new password',
          })}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          autoCapitalize="none"
          error={confirmErr}
        />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button variant="primary" fullWidth loading={loading} onPress={handleSubmit}>
          {t('changePassword.submit', { defaultValue: 'Update password' })}
        </Button>
      </View>
    </ScreenContainer>
  );
}
