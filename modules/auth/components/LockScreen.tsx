import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Text } from '@/common/components/Text';
import { useTheme } from '@/common/theme';
import { AuthPrimaryButton } from '@/modules/auth/components/AuthPrimaryButton';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  readBiometricCapability,
  type BiometricKind,
} from '@/modules/auth/biometrics/capability';

/**
 * The gate in front of a restored session.
 *
 * Shown instead of the app — not on top of it and not after a glimpse of it —
 * because the whole promise of this feature is that somebody holding an
 * unlocked phone cannot read a child's records without being the person the
 * phone belongs to. `(protected)/_layout.tsx` renders this in place of
 * `MainLayout`, so there is no route to reach past it and no frame in which
 * the home screen is visible first.
 *
 * It prompts once on its own, because that is what the person expected when
 * they opened the app, and then waits. A dismissed prompt leaves the button:
 * people cancel by accident, and a screen that re-prompts in a loop is one
 * nobody can escape to the password. A prompt that *cannot* run — biometrics
 * locked out after too many attempts, or an enrolment removed since — swaps
 * the button for the honest way forward rather than offering a control that
 * will fail every time it is pressed.
 */
export function LockScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const { palette, spacing } = useTheme();
  const { unlockSession, logout, user, tenantName } = useAuth();

  const [busy, setBusy] = useState(false);
  // Cosmetic only — it decides the icon and nothing else, so it starts on the
  // neutral word and corrects itself when the probe answers. Gating the screen
  // on it would put a spinner in front of a gate that is ready to run.
  const [kind, setKind] = useState<BiometricKind>('biometrics');
  const [biometricsUsable, setBiometricsUsable] = useState(true);
  // The automatic prompt is once per mount, not once per render. Without this
  // a re-render mid-prompt would stack a second OS dialog on the first.
  const hasPromptedRef = useRef(false);

  const icon = kind === 'fingerprint' ? 'finger-print' : 'scan-outline';

  useEffect(() => {
    let active = true;
    void readBiometricCapability().then((capability) => {
      if (active) setKind(capability.kind);
    });
    return () => {
      active = false;
    };
  }, []);

  const attemptUnlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await unlockSession({
        message: t('biometrics.promptMessage'),
        cancelLabel: t('biometrics.usePassword'),
      });
      // 'unlocked' needs nothing here: the provider lowers the gate and this
      // screen unmounts with it.
      if (outcome === 'unavailable') setBiometricsUsable(false);
    } finally {
      setBusy(false);
    }
  }, [busy, t, unlockSession]);

  useEffect(() => {
    if (hasPromptedRef.current) return;
    hasPromptedRef.current = true;
    void attemptUnlock();
    // Deliberately once, on mount. `attemptUnlock` changes identity with
    // `busy`, and depending on it would re-run this the moment the first
    // prompt settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: palette.surfaceContainerHigh,
          }}
        >
          <Ionicons name={icon} size={44} color={palette.primary} />
        </View>

        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Text variant="headlineMd" style={{ textAlign: 'center' }}>
            {t('biometrics.lockedTitle')}
          </Text>
          {/* Whose session is waiting, so a shared phone does not unlock into
              an account somebody did not expect. */}
          <Text
            variant="bodyMd"
            color="onSurfaceVariant"
            style={{ textAlign: 'center' }}
          >
            {user?.name || user?.email}
            {tenantName ? ` · ${tenantName}` : ''}
          </Text>
        </View>

        {busy ? (
          <ActivityIndicator color={palette.primary} />
        ) : biometricsUsable ? (
          <AuthPrimaryButton onPress={() => void attemptUnlock()} fullWidth>
            {t('biometrics.unlock')}
          </AuthPrimaryButton>
        ) : (
          <Text
            variant="bodyMd"
            color="onSurfaceVariant"
            style={{ textAlign: 'center' }}
          >
            {t('biometrics.unavailable')}
          </Text>
        )}

        <Pressable
          onPress={() => void logout()}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text variant="bodyMd" color="primary">
            {t('biometrics.usePassword')}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
