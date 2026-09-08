import React from 'react';
import { ActivityIndicator, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/common/components/Text';
import { useTheme } from '@/common/theme';
import { ProfileActionRow } from '@/modules/profile/components/ProfileActionRow';
import { useBiometricUnlockSetting } from '@/modules/auth/biometrics/useBiometricUnlockSetting';

/**
 * The Settings switch for biometric unlock.
 *
 * Its own component rather than more lines in `settings.tsx`, which is already
 * long enough that a fourth toggle's worth of state would start to bury the
 * screen's actual job.
 *
 * Renders nothing at all on a phone with no biometric hardware. A control that
 * can never be switched on is not information — it is a dead switch somebody
 * will tap twice and then ask support about. A phone that *has* the hardware
 * but has nothing enrolled is a different case and does show, disabled, with
 * the one instruction that would fix it: the setting is in the OS, not here,
 * and saying so is the only way the person gets from here to there.
 */
export function BiometricUnlockRow() {
  const { t } = useTranslation(['settings', 'auth']);
  const { palette, spacing } = useTheme();
  const { capability, isEnabled, isBusy, didFail, toggle } =
    useBiometricUnlockSetting();

  // Still probing, or no hardware to speak of.
  if (!capability || capability.reason === 'no_hardware') return null;
  if (capability.reason === 'unavailable') return null;

  const notEnrolled = capability.reason === 'not_enrolled';
  const label =
    capability.kind === 'face'
      ? t('settings:biometrics.face')
      : capability.kind === 'fingerprint'
        ? t('settings:biometrics.fingerprint')
        : t('settings:biometrics.generic');

  const hint = notEnrolled
    ? t('settings:biometrics.notEnrolled')
    : t('settings:biometrics.subtitle');

  return (
    <>
      <ProfileActionRow
        icon={capability.kind === 'fingerprint' ? 'finger-print-outline' : 'scan-outline'}
        label={label}
        hint={hint}
        trailing={
          isBusy ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <Switch
              value={isEnabled}
              onValueChange={(next) =>
                void toggle(next, {
                  message: t('auth:biometrics.promptMessage'),
                  cancelLabel: t('auth:biometrics.usePassword'),
                })
              }
              trackColor={{
                false: palette.outlineVariant,
                true: palette.primary,
              }}
              thumbColor={palette.surfaceContainerLowest}
              disabled={isBusy || notEnrolled}
              accessibilityLabel={label}
            />
          )
        }
      />
      {didFail ? (
        <Text
          variant="labelSm"
          color="onSurfaceVariant"
          style={{ marginLeft: spacing.xs, marginTop: spacing.xs }}
        >
          {t('settings:biometrics.failed')}
        </Text>
      ) : null}
    </>
  );
}
