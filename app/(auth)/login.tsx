import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Text } from '@/common/components/Text';
import { Link } from '@/common/components/Link';
import { BrandHeader } from '@/modules/auth/components/BrandHeader';
import { AuthCard } from '@/modules/auth/components/AuthCard';
import { AuthTrustFooter } from '@/modules/auth/components/AuthTrustFooter';
import { SupportFab } from '@/modules/auth/components/SupportFab';
import { EmailPasswordForm } from '@/modules/auth/components/EmailPasswordForm';
import { MobilePinForm } from '@/modules/auth/components/MobilePinForm';
import { MobileOtpForm } from '@/modules/auth/components/MobileOtpForm';
import { usePublishedAuthMethods } from '@/modules/auth/hooks/usePublishedAuthMethods';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { didSessionExpire } from '@/common/services/sessionExpiry';

/** Which form is on screen. `'home'` is a sentinel, not a fourth form — it
 * resolves to whichever method is this school's default (see `homeMode`
 * below) until the visitor explicitly picks a different one. Using a
 * sentinel rather than seeding the real state with `homeMode` means a
 * navigation choice already made is never silently overwritten by branding
 * arriving late. */
type Mode = 'home' | 'email' | 'otp' | 'pin';

export default function LoginScreen() {
  const { t } = useTranslation('auth');
  const { palette, spacing } = useTheme();

  // Arriving here mid-task because the session died, rather than because the
  // user asked to sign out, needs saying — otherwise the app looks like it
  // threw the work away for no reason. Read once on mount: the flag is set
  // before this screen is navigated to, and only a successful sign-in clears
  // it, so there is nothing to re-render for.
  const [wasSessionExpired] = useState(didSessionExpire);

  // Which ways in this school allows, and its display identity — both read
  // from the same public branding response. A method a school has not
  // enabled is not offered, and because the server refuses it anyway this
  // hides an option rather than enforcing a rule. `loaded` distinguishes
  // "still asking" from "asked and this school offers nothing extra" — see
  // `usePublishedAuthMethods`.
  const { allows, methods, branding, loaded } = usePublishedAuthMethods();
  const [mode, setMode] = useState<Mode>('home');

  const { isAuthenticated, mustResetPassword, pendingTenantChoice, loginWithTenant, clearPendingTenantChoice } =
    useAuth();
  const [choosingTenant, setChoosingTenant] = useState(false);

  // `email_password` is a real, disable-able method key like the other two
  // (`server/modules/auth/policy.py`). Whether it is *offered as a link* from
  // another form only matters once `loaded` is true — nothing method-specific
  // renders before then (see below) — and an empty `methods` (offline, or a
  // school with no policy row) still lands on the email form regardless of
  // this value, via `homeMode`'s own fallback a few lines down. So this no
  // longer needs a `!loaded` escape hatch the way it used to.
  const emailOffered = methods.includes('email_password');
  const otpOffered = allows('mobile_otp');
  const pinOffered = allows('mobile_pin');

  // The screen this school lands on. Email whenever it is offered — the
  // common case, and every staff account's only method — otherwise whichever
  // mobile method is. If a policy row somehow enables none of the three
  // (a configuration the panel does not let anyone reach), email is still
  // the fallback: a signed-out screen must never render as empty.
  const homeMode: 'email' | 'otp' | 'pin' = emailOffered
    ? 'email'
    : otpOffered
      ? 'otp'
      : pinOffered
        ? 'pin'
        : 'email';
  const activeMode: 'email' | 'otp' | 'pin' = mode === 'home' ? homeMode : mode;

  // Both sign-in paths land here — plain sign-in and the tenant picker below
  // both end in the auth context accepting a login response — so the one place
  // that reads the response's `force_password_reset` is the one place that
  // decides where sign-in goes. True of all three methods now, not just
  // email: each writes to the same auth context state this effect watches.
  useEffect(() => {
    if (!isAuthenticated) return;
    router.replace(
      mustResetPassword ? '/(auth)/set-password' : '/(protected)/home',
    );
  }, [isAuthenticated, mustResetPassword]);

  const handleChooseSchool = async (tenantId: string) => {
    setChoosingTenant(true);
    try {
      // No navigation here: the effect above owns it. Routing from this closure
      // would read the `mustResetPassword` captured before the login, and send
      // a flagged teacher to a home screen the server refuses.
      await loginWithTenant(tenantId);
    } catch {
      // Error surfaced by auth context
    } finally {
      setChoosingTenant(false);
    }
  };

  // Tenant-choice sub-state — preserves existing multi-tenant flow. Email
  // sign-in only: a mobile number is unique inside one school at best, so
  // neither mobile method ever produces this choice.
  if (pendingTenantChoice?.tenants?.length) {
    return (
      <View style={{ flex: 1 }}>
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
        <SupportFab />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer noHorizontalPadding>
        <BrandHeader branding={branding} loaded={loaded} />

        <View
          style={{
            paddingHorizontal: spacing.marginMobile,
            marginTop: spacing.xs,
            // Extra breathing room below the trust footer, on top of the
            // safe-area bottom inset `ScreenContainer`'s SafeAreaView already
            // reserves — without it the footer's last line can sit flush
            // against that inset with no visual margin of its own.
            paddingBottom: spacing.lg,
          }}
        >
          <AuthCard>
            {!loaded ? (
              // Rendering the email form here (the old behaviour) is what made
              // an OTP-only school visibly swap forms once its policy landed —
              // nothing method-specific is known yet, so nothing
              // method-specific renders. `BrandHeader` above already shows its
              // own loaded=false treatment (a plain mark, no borrowed
              // identity); this is that same "still asking" moment for the
              // form area, not a second design. The card itself still renders
              // — it is chrome, not borrowed identity, so there is nothing
              // dishonest about showing it before branding settles.
              <ActivityIndicator
                size="large"
                color={palette.primary}
                style={{ marginTop: spacing.xl }}
              />
            ) : activeMode === 'email' ? (
              <EmailPasswordForm
                wasSessionExpired={wasSessionExpired}
                onUseOtp={otpOffered ? () => setMode('otp') : undefined}
                onUsePin={pinOffered ? () => setMode('pin') : undefined}
              />
            ) : activeMode === 'otp' ? (
              <MobileOtpForm
                onBack={emailOffered ? () => setMode('email') : undefined}
                onUsePin={pinOffered ? () => setMode('pin') : undefined}
              />
            ) : (
              <MobilePinForm
                onBack={emailOffered ? () => setMode('email') : undefined}
                onUseOtp={otpOffered ? () => setMode('otp') : undefined}
              />
            )}
          </AuthCard>

          <AuthTrustFooter />
        </View>
      </ScreenContainer>
      <SupportFab />
    </View>
  );
}
