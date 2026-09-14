// client/modules/teacher-leaves/screens/MyTeacherLeavesScreen.tsx
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { EmptyState } from '@/common/components/EmptyState';
import { FilterChips } from '@/common/components/FilterChips';
import { DetailTabs } from '@/common/components/DetailTabs';
import { PageHeader } from '@/common/components/PageHeader';
import { Skeleton } from '@/common/components/Skeleton';
import { StatTiles } from '@/common/components/StatTiles';
import { useDialog, useToast } from '@/common/feedback';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { useHolidays } from '@/modules/holidays/hooks/useHolidays';
import { schoolTodayIso } from '@/common/utils/datetime';
import type { LeaveBalance, TeacherLeave } from '@/modules/teachers/types';

import {
  useMyTeacherLeaves,
  useMyLeaveBalances,
  useCancelTeacherLeave,
} from '../hooks/useTeacherLeaves';
import { LeaveRequestCard } from '../components/LeaveRequestCard';
import { HolidayRow } from '../components/HolidayRow';

type TopTab = 'mydata' | 'holidays';
type StatusFilter = '' | 'pending' | 'approved' | 'rejected' | 'cancelled';

const STATUS_FILTERS: StatusFilter[] = ['', 'pending', 'approved', 'rejected', 'cancelled'];

/**
 * A teacher's own leave.
 *
 * Rebuilt from the shared components the rest of the app uses. The screen this
 * replaces was 1439 lines that drew its own cards, its own status pills and
 * its own tabs, put the application form in a `formSheet` modal and the
 * balance detail in a second modal on top of it — so the one screen a teacher
 * opens most did not look like the product it belongs to.
 *
 * The second tab row is gone. Summary and balances are sections in one scroll,
 * because tabs inside tabs made a teacher press twice to reach the thing the
 * screen is named after.
 */
export default function MyTeacherLeavesScreen() {
  const { t } = useTranslation('teacherLeaves');
  const toast = useToast();
  const { confirm } = useDialog();
  const { palette, spacing, radius, elevation } = useTheme();
  const { permissions: rawPerms } = usePermissions();

  // Raw permissions, not hierarchical: an admin holds `system.manage`, which
  // would expand to grant `teacher.leave.apply` and wrongly show them a
  // teacher's own application flow.
  const canApplyLeave =
    rawPerms.includes(PERMS.TEACHER_LEAVE_APPLY) &&
    !rawPerms.includes(PERMS.SYSTEM_MANAGE) &&
    !rawPerms.includes(PERMS.USER_MANAGE) &&
    !rawPerms.includes(PERMS.TEACHER_LEAVE_MANAGE);

  const [topTab, setTopTab] = useState<TopTab>(canApplyLeave ? 'mydata' : 'holidays');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [holYear] = useState(() => Number(schoolTodayIso().slice(0, 4)));

  React.useEffect(() => {
    if (!canApplyLeave) setTopTab('holidays');
  }, [canApplyLeave]);

  const leavesQuery = useMyTeacherLeaves(undefined, canApplyLeave);
  const balancesQuery = useMyLeaveBalances(canApplyLeave);
  const cancelMutation = useCancelTeacherLeave();

  const {
    holidays: hookHolidays,
    recurringHolidays: hookRecurring,
    loading: holidaysLoading,
    fetchHolidays,
    fetchRecurring,
  } = useHolidays();

  React.useEffect(() => {
    if (topTab !== 'holidays') return;
    fetchHolidays({ start_date: `${holYear}-01-01`, end_date: `${holYear}-12-31` });
    fetchRecurring();
  }, [topTab, holYear, fetchHolidays, fetchRecurring]);

  const leaves = useMemo(() => leavesQuery.data ?? [], [leavesQuery.data]);
  const balances = balancesQuery.data ?? [];

  const counts = useMemo(
    () => ({
      approved: leaves.filter((l) => l.status === 'approved').length,
      pending: leaves.filter((l) => l.status === 'pending').length,
      rejected: leaves.filter((l) => l.status === 'rejected').length,
    }),
    [leaves],
  );

  const filtered = statusFilter
    ? leaves.filter((l) => l.status === statusFilter)
    : leaves;

  // Weekly offs are every week and would bury the actual holidays.
  const holidays = [...hookHolidays, ...hookRecurring].filter(
    (h) => h.holiday_type !== 'weekly_off',
  );

  const handleCancel = async (leave: TeacherLeave) => {
    const ok = await confirm({
      title: t('tracker.alerts.cancelLeaveTitle', { defaultValue: 'Cancel this request?' }),
      description: t('tracker.alerts.cancelLeaveBody', {
        defaultValue: 'The days go back to your balance.',
      }),
      tone: 'danger',
      confirmLabel: t('tracker.alerts.yesCancel', { defaultValue: 'Cancel request' }),
      cancelLabel: t('tracker.alerts.no', { defaultValue: 'Keep it' }),
    });
    if (!ok) return;
    try {
      await cancelMutation.mutateAsync(leave.id);
    } catch (e: unknown) {
      toast.error(
        e instanceof Error
          ? e.message
          : t('tracker.alerts.cancelFailed', { defaultValue: 'Could not cancel' }),
      );
    }
  };

  const renderMyData = () => (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <LeaveRequestCard
          leave={item}
          onCancel={item.status === 'pending' ? handleCancel : undefined}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
          <StatTiles
            tiles={[
              {
                label: t('tracker.statApproved', { defaultValue: 'Approved' }),
                value: String(counts.approved),
                tone: 'success',
              },
              {
                label: t('tracker.statPending', { defaultValue: 'Pending' }),
                value: String(counts.pending),
                tone: 'warning',
              },
              {
                label: t('tracker.statRejected', { defaultValue: 'Rejected' }),
                value: String(counts.rejected),
                tone: 'error',
              },
            ]}
          />

          <View style={{ gap: spacing.sm }}>
            <Text variant="labelMd" color="onSurfaceVariant">
              {t('tracker.sectionLeaveBalance', { defaultValue: 'Leave balance' })}
            </Text>
            {balancesQuery.isLoading ? (
              <Skeleton width="100%" height={96} radius={radius.xl} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm }}
              >
                {balances.map((balance) => (
                  <BalanceChip key={balance.id} balance={balance} />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text variant="labelMd" color="onSurfaceVariant">
              {t('tracker.sectionRecentRequests', { defaultValue: 'Requests' })}
            </Text>
            <FilterChips
              options={STATUS_FILTERS.map((value) => ({
                value,
                label: value
                  ? t(`filters.${value}`, { defaultValue: value })
                  : t('filters.all', { defaultValue: 'All' }),
              }))}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        leavesQuery.isLoading ? (
          <View style={{ gap: spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width="100%" height={120} radius={radius.xl} />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<AppIcon name="calendar-outline" size="xl" color="onSurfaceVariant" />}
            title={t('tracker.emptyNoRequestsYet', { defaultValue: 'No leave requests yet' })}
            description={t('tracker.emptyRequestsNoFilter', {
              defaultValue: 'When you apply for leave, it will show up here.',
            })}
            action={{
              label: t('tracker.emptyApplyForLeave', { defaultValue: 'Apply for leave' }),
              onPress: () => router.push('/(protected)/teacher-leaves/new' as never),
            }}
          />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={leavesQuery.isRefetching}
          onRefresh={() => {
            leavesQuery.refetch();
            balancesQuery.refetch();
          }}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
    />
  );

  const renderHolidays = () => (
    <FlatList
      data={holidays}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <HolidayRow holiday={item} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListHeaderComponent={
        <Text
          variant="labelMd"
          color="onSurfaceVariant"
          style={{ paddingBottom: spacing.sm }}
        >
          {t('tracker.yearRange', { year: holYear, defaultValue: String(holYear) })}
        </Text>
      }
      ListEmptyComponent={
        holidaysLoading ? (
          <View style={{ gap: spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width="100%" height={96} radius={radius.xl} />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<AppIcon name="sunny-outline" size="xl" color="onSurfaceVariant" />}
            title={t('tracker.emptyHolidaysYear', { defaultValue: 'No holidays listed' })}
            description={t('tracker.holidaysReadOnlySub', {
              defaultValue: 'The school has not published holidays for this year.',
            })}
          />
        )
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
    />
  );

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile }}>
      <PageHeader
        title={t('tracker.title', { defaultValue: 'Leave' })}
        right={
          <AppIcon
            name="document-text-outline"
            size="lg"
            color="onSurfaceVariant"
            onPress={() => router.push('/(protected)/teacher-leaves/policy' as never)}
            accessibilityLabel={t('policyModal.title', { defaultValue: 'Leave policy' })}
          />
        }
        noHorizontalPadding
        divider={false}
      />

      {canApplyLeave ? (
        <View style={{ marginBottom: spacing.md }}>
          <DetailTabs
            tabs={[
              { key: 'mydata', label: t('tracker.myData', { defaultValue: 'My leave' }) },
              { key: 'holidays', label: t('tracker.holidays', { defaultValue: 'Holidays' }) },
            ]}
            active={topTab}
            onChange={(k) => setTopTab(k as TopTab)}
          />
        </View>
      ) : null}

      {topTab === 'mydata' ? renderMyData() : renderHolidays()}

      {canApplyLeave && topTab === 'mydata' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tracker.apply', { defaultValue: 'Apply for leave' })}
          onPress={() => router.push('/(protected)/teacher-leaves/new' as never)}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: spacing.lg,
            right: spacing.marginMobile,
            width: 56,
            height: 56,
            borderRadius: radius.full,
            backgroundColor: palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            ...elevation.card,
          })}
        >
          <AppIcon name="add" size="xl" color="onPrimary" />
        </Pressable>
      ) : null}
    </View>
  );
}

/** One leave type's remaining days, tapping through to the full breakdown. */
function BalanceChip({ balance }: { balance: LeaveBalance }) {
  const { t } = useTranslation('teacherLeaves');
  const { palette, spacing, radius, elevation } = useTheme();

  const available = balance.is_unlimited ? '∞' : balance.available_days.toFixed(1);
  const tone = balance.is_unlimited
    ? 'success'
    : balance.available_days <= 0
      ? 'error'
      : balance.available_days < 2
        ? 'warning'
        : 'success';

  return (
    <PressScale
      onPress={() =>
        router.push({
          pathname: '/(protected)/teacher-leaves/balance/[type]',
          params: { type: balance.leave_type },
        } as never)
      }
      style={[
        {
          minWidth: 104,
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.xs,
          alignItems: 'center',
        },
        elevation.card,
      ]}
    >
      <Text variant="labelSm" color="onSurfaceVariant">
        {t(`leaveTypes.${balance.leave_type}`, { defaultValue: balance.leave_type })}
      </Text>
      <Text variant="headlineMd" color={tone}>
        {available}
      </Text>
      <Text variant="labelSm" color="onSurfaceVariant">
        {t('tracker.balanceDetail.available', { defaultValue: 'Available' })}
      </Text>
    </PressScale>
  );
}
