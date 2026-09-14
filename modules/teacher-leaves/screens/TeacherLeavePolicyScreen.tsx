// client/modules/teacher-leaves/screens/TeacherLeavePolicyScreen.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { PageHeader } from '@/common/components/PageHeader';
import { Skeleton } from '@/common/components/Skeleton';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import { useLeavePolicies } from '../hooks/useTeacherLeaves';

/**
 * What the school allows, per leave type. Read-only here — editing belongs to
 * the administrator's screen, not a teacher's.
 *
 * A screen rather than the modal it replaces, so it can be linked to and
 * backed out of like everything else.
 */
export default function TeacherLeavePolicyScreen() {
  const { t } = useTranslation('teacherLeaves');
  const { spacing, radius } = useTheme();
  const policiesQuery = useLeavePolicies();

  const policies = policiesQuery.data ?? [];

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile }}>
      <PageHeader
        title={t('policyModal.title', { defaultValue: 'Leave policy' })}
        onBack={() => router.back()}
        backLabel={t('tracker.back', { defaultValue: 'Back' })}
        noHorizontalPadding
        divider={false}
      />

      {policiesQuery.isLoading ? (
        <View style={{ gap: spacing.md, paddingTop: spacing.lg }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={120} radius={radius.lg} />
          ))}
        </View>
      ) : policies.length === 0 ? (
        <EmptyState
          icon={<AppIcon name="document-text-outline" size="xl" color="onSurfaceVariant" />}
          title={t('policyModal.empty.title', { defaultValue: 'No policy set' })}
          description={t('policyModal.empty.body', {
            defaultValue: 'The school has not published a leave policy yet.',
          })}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.scrollBottom }}
          showsVerticalScrollIndicator={false}
        >
          {policies.map((policy) => (
            <DetailCard
              key={policy.id}
              title={t(`leaveTypes.${policy.leave_type}`, { defaultValue: policy.leave_type })}
            >
              <DetailRow
                icon="calendar-outline"
                label={t('policyModal.totalDays', { defaultValue: 'Days per year' })}
                value={
                  policy.is_unlimited
                    ? t('tracker.balanceDetail.unlimited', { defaultValue: 'No limit' })
                    : String(policy.total_days)
                }
              />
              <DetailRow
                icon="arrow-forward-circle-outline"
                label={t('policyModal.carryForward', { defaultValue: 'Carry forward' })}
                value={
                  policy.is_carry_forward_allowed
                    ? t('policyModal.carryForwardUpTo', {
                        days: policy.max_carry_forward_days,
                        defaultValue: `Up to ${policy.max_carry_forward_days} days`,
                      })
                    : t('policyModal.notAllowed', { defaultValue: 'Not allowed' })
                }
              />
              <DetailRow
                icon="create-outline"
                label={t('policyModal.requiresReason', { defaultValue: 'Reason required' })}
                value={
                  policy.requires_reason
                    ? t('policyModal.yes', { defaultValue: 'Yes' })
                    : t('policyModal.no', { defaultValue: 'No' })
                }
              />
            </DetailCard>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
