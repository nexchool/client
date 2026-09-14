// client/modules/teacher-leaves/screens/TeacherLeaveBalanceScreen.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { PageHeader } from '@/common/components/PageHeader';
import { Skeleton } from '@/common/components/Skeleton';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import { useMyLeaveBalances } from '../hooks/useTeacherLeaves';

/**
 * One leave type's balance in full — a screen, not the bottom sheet it
 * replaces. A sheet cannot be linked to, cannot be backed out of with the
 * hardware button, and stacked badly on top of the balance modal that used to
 * sit underneath it.
 */
export default function TeacherLeaveBalanceScreen() {
  const { t } = useTranslation('teacherLeaves');
  const { spacing, radius } = useTheme();
  const { type } = useLocalSearchParams<{ type: string }>();
  const balancesQuery = useMyLeaveBalances();

  const balance = balancesQuery.data?.find((b) => b.leave_type === type);
  const typeLabel = t(`leaveTypes.${type}`, { defaultValue: type ?? '' });

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile }}>
      <PageHeader
        title={t('tracker.balanceDetail.leaveSuffix', {
          type: typeLabel,
          defaultValue: `${typeLabel} leave`,
        })}
        onBack={() => router.back()}
        backLabel={t('tracker.back', { defaultValue: 'Back' })}
        noHorizontalPadding
        divider={false}
      />

      {balancesQuery.isLoading ? (
        <View style={{ gap: spacing.md, paddingTop: spacing.lg }}>
          <Skeleton width="100%" height={180} radius={radius.lg} />
        </View>
      ) : !balance ? (
        <EmptyState
          icon={<AppIcon name="wallet-outline" size="xl" color="onSurfaceVariant" />}
          title={t('tracker.emptyNoBalanceData', { defaultValue: 'No balance recorded' })}
          description={t('tracker.balanceDetail.noneBody', {
            defaultValue: 'The school has not set an allowance for this leave type.',
          })}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.scrollBottom }}
          showsVerticalScrollIndicator={false}
        >
          {balance.is_unlimited ? (
            <DetailCard
              title={t('tracker.balanceDetail.thisYear', { defaultValue: 'This year' })}
              accent="success"
            >
              <DetailRow
                icon="infinite-outline"
                label={typeLabel}
                value={t('tracker.balanceDetail.unlimited', { defaultValue: 'No limit' })}
              />
            </DetailCard>
          ) : (
            <DetailCard
              title={t('tracker.balanceDetail.thisYear', { defaultValue: 'This year' })}
            >
              <DetailRow
                icon="checkmark-circle-outline"
                label={t('tracker.balanceDetail.available', { defaultValue: 'Available' })}
                value={balance.available_days.toFixed(1)}
              />
              <DetailRow
                icon="time-outline"
                label={t('tracker.balanceDetail.pending', { defaultValue: 'Pending' })}
                value={balance.pending_days.toFixed(1)}
              />
              <DetailRow
                icon="remove-circle-outline"
                label={t('tracker.balanceDetail.used', { defaultValue: 'Used' })}
                value={balance.used_days.toFixed(1)}
              />
              <DetailRow
                icon="calendar-outline"
                label={t('tracker.balAcademicYear', { defaultValue: 'Academic year' })}
                value={balance.academic_year}
              />
            </DetailCard>
          )}

          {balance.carried_forward_days > 0 ? (
            <DetailCard
              title={t('tracker.balanceDetail.carriedForwardTitle', {
                defaultValue: 'Carried forward',
              })}
              accent="secondaryContainer"
            >
              <DetailRow
                icon="arrow-forward-circle-outline"
                label={t('tracker.balanceDetail.carriedForwardLabel', {
                  defaultValue: 'From last year',
                })}
                value={balance.carried_forward_days.toFixed(1)}
              />
            </DetailCard>
          ) : null}

          {balance.notes ? (
            <Text variant="bodyMd" color="onSurfaceVariant">
              {balance.notes}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
