import React, { useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { PageHeader } from '@/common/components/PageHeader';
import { ProfileActionRow } from '@/modules/profile/components/ProfileActionRow';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useSubscriptionState, useSubscriptionPayments } from '@/modules/subscription/hooks/useSubscription';
import { useSubscriptionLock } from '@/modules/subscription/hooks/useSubscriptionLock';
import { SubscriptionStatusHero } from '@/modules/subscription/components/SubscriptionStatusHero';
import { SubscriptionPaymentsList } from '@/modules/subscription/components/SubscriptionPaymentsList';

/**
 * Where a school's admin sees the same start date, due date, grace countdown
 * and payment history admin-web already shows — the mobile side of the
 * subscription feature. An admin whose school is suspended is redirected
 * here on their own (`app/(protected)/_layout.tsx`); sign-out below is the
 * way out of that lockout besides paying.
 */
export default function SubscriptionScreen() {
  const router = useRouter();
  const { palette, spacing } = useTheme();
  const { t } = useTranslation(['subscription', 'common']);
  const { logout } = useAuth();
  const locked = useSubscriptionLock();

  const { data: state, isLoading, isError } = useSubscriptionState();
  const canReadPayments = Boolean(state?.term);
  const { data: payments } = useSubscriptionPayments(canReadPayments);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(protected)/home');
    }
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      {/* No back chevron while locked — there is nowhere to go back to that
       * the redirect in `_layout.tsx` doesn't immediately send back here, so
       * the affordance would have nothing behind it. */}
      <PageHeader
        title={t('title')}
        onBack={locked ? undefined : handleBack}
        backLabel={t('common:back')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.scrollBottom, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: spacing.xl }} />
        ) : isError || !state ? (
          <Text variant="bodyMd" color="error">
            {t('loadError')}
          </Text>
        ) : (
          <>
            <SubscriptionStatusHero state={state} t={t} />

            {state.term ? (
              <View>
                <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
                  {t('paymentsTitle')}
                </Text>
                <Text variant="bodySm" color="onSurfaceVariant" style={{ marginBottom: spacing.md }}>
                  {t('paymentsSubtitle')}
                </Text>
                <SubscriptionPaymentsList
                  payments={payments ?? []}
                  emptyLabel={t('paymentsEmpty')}
                  voidedLabel={(reason) => t('paymentsVoided', { reason })}
                />
              </View>
            ) : null}
          </>
        )}

        <ProfileActionRow
          icon="log-out-outline"
          label={t('signOut')}
          onPress={() => void logout()}
          destructive
          trailing={null}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
});
