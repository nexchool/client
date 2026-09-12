import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { useAdminDashboard } from '@/modules/dashboard/hooks/useAdminDashboard';
import type { SectionVisibility } from '@/modules/dashboard/types';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { DashboardKpiCard } from './DashboardKpiCard';
import { FeeTrendChart } from './FeeTrendChart';
import { DashboardActionRow } from './DashboardActionRow';
import { RecordPaymentPicker } from './RecordPaymentPicker';
import { formatCurrencyShort } from '@/common/utils/formatCurrency';
import { formatDateLong } from '@/common/utils/datetime';

export function AdminHome() {
  const { t } = useTranslation('home');
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useAdminDashboard();
  const [recordPaymentVisible, setRecordPaymentVisible] = React.useState(false);

  // The date *at the school*, not on the phone — between 00:00 and 05:30 IST
  // a device on UTC would greet the admin with yesterday.
  const today = formatDateLong(new Date());

  const overview = data?.overview;
  const todayOps = data?.today;
  const finance = data?.finance;
  const alerts = data?.alerts;
  const flags = data?.feature_flags;

  // Two independent reasons a section is absent, and they are not the same
  // question. `enabled` asks whether the school is on that plan; `visible`
  // asks whether this person may see it — a finance sub-admin gets the fee
  // card and nothing else, decided server-side so the data never arrives.
  const shown = (section?: SectionVisibility) => section?.visible !== false;

  // Quick Actions are shortcuts to other screens, so they answer to the same
  // permissions those screens do — not to the dashboard payload. A fees desk
  // offered "Take Attendance" would be offered a 403.
  const { hasPermission, hasAnyPermission } = usePermissions();
  const canMarkAttendance = hasPermission(PERMS.ATTENDANCE_MARK);
  const canAddStudent = hasPermission(PERMS.STUDENT_CREATE);
  const canRecordPayment = hasAnyPermission([
    PERMS.FEES_PAYMENT_RECORD,
    PERMS.FINANCE_COLLECT,
  ]);
  const canAnnounce = hasPermission(PERMS.ANNOUNCEMENT_CREATE);

  const attendanceEnabled =
    !!flags?.attendance && todayOps?.enabled !== false && shown(todayOps);
  const feesEnabled =
    !!flags?.fees_management && finance?.enabled !== false && shown(finance);
  const overviewShown = shown(overview);

  // "Today's Collection" used to show `finance.total_collected`, which is the
  // sum of every fee ever paid this year — the wrong number, and at
  // ₹1,45,77,190 one that no half-width card can hold. Today's figure is
  // already in the payload: the last point of the seven-day series the chart
  // below draws, so the tile and the chart now agree by construction.
  const series = finance?.last_7_days_collection ?? [];
  const collectedToday = Number(series[series.length - 1]?.amount ?? 0);

  // `trend_percentage` compares this week's seven days with the seven before,
  // so the sub-line says that rather than implying a day-over-day change.
  const trendPct = finance?.trend_percentage ?? 0;
  const trendTone: 'up' | 'down' | 'flat' = trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';
  const trendLabel = t('admin.kpi.feesTrend', {
    defaultValue: '{{pct}} vs last week',
    pct: `${trendPct > 0 ? '+' : ''}${trendPct}%`,
  });

  const alertRows = alerts
    ? [
        { count: alerts.students_without_class, label: t('admin.alert.studentsNoClass', { defaultValue: '{{n}} students without a class', n: alerts.students_without_class }) },
        { count: alerts.overdue_fees_students, label: t('admin.alert.overdueFees', { defaultValue: '{{n}} overdue fee students', n: alerts.overdue_fees_students }) },
        { count: alerts.timetable_conflicts, label: t('admin.alert.timetableConflicts', { defaultValue: '{{n}} timetable conflicts', n: alerts.timetable_conflicts }) },
        { count: alerts.classes_without_timetable, label: t('admin.alert.classesNoTimetable', { defaultValue: '{{n}} classes without a timetable', n: alerts.classes_without_timetable }) },
      ].filter((row) => (row.count ?? 0) > 0).slice(0, 4)
    : [];

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.scrollBottom,
      }}
      refreshControl={
        <RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="headlineLg" color="onSurface">
          {t('admin.title', { defaultValue: 'School Overview' })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t('admin.subtitle', {
            defaultValue: 'Real-time insights for today, {{date}}.',
            date: today,
          })}
        </Text>
      </View>

      {isLoading && !data ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Skeleton width="48%" height={120} radius={radius.xl} />
          <Skeleton width="48%" height={120} radius={radius.xl} />
          <Skeleton width="48%" height={120} radius={radius.xl} />
          <Skeleton width="48%" height={120} radius={radius.xl} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {overviewShown ? (
          <View style={{ width: '48%' }}>
            <DashboardKpiCard
              label={t('admin.kpi.students', { defaultValue: 'Total Students' })}
              value={String(overview?.total_students ?? 0)}
              accentColor="primary"
              iconName="school-outline"
              iconChipBg="primaryContainer"
              iconChipFg="onPrimaryContainer"
            />
          </View>
          ) : null}
          {overviewShown ? (
          <View style={{ width: '48%' }}>
            <DashboardKpiCard
              label={t('admin.kpi.teachers', { defaultValue: 'Total Teachers' })}
              value={String(overview?.total_teachers ?? 0)}
              accentColor="tertiary"
              iconName="people-outline"
              iconChipBg="tertiaryContainer"
              iconChipFg="onTertiaryContainer"
            />
          </View>
          ) : null}
          {shown(todayOps) ? (
          <View style={{ width: '48%' }}>
            <DashboardKpiCard
              label={t('admin.kpi.attendance', { defaultValue: 'Attendance Today' })}
              value={
                attendanceEnabled
                  ? `${todayOps?.attendance_completion_percentage ?? 0}%`
                  : '—'
              }
              accentColor="secondary"
              iconName="checkmark-done-outline"
              iconChipBg="secondaryContainer"
              iconChipFg="onSecondaryContainer"
              progress={
                attendanceEnabled
                  ? Number(todayOps?.attendance_completion_percentage ?? 0)
                  : undefined
              }
            />
          </View>
          ) : null}
          {feesEnabled ? (
            <View style={{ width: '48%' }}>
              <DashboardKpiCard
                label={t('admin.kpi.fees', { defaultValue: "Today's Collection" })}
                value={formatCurrencyShort(collectedToday)}
                accentColor="success"
                iconName="wallet-outline"
                iconChipBg="surfaceContainerHigh"
                iconChipFg="success"
                trend={{ label: trendLabel, tone: trendTone }}
              />
            </View>
          ) : null}
        </View>
      )}

      {feesEnabled ? (
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
            },
          ]}
        >
          <FeeTrendChart
            data={finance?.last_7_days_collection ?? []}
            title={t('admin.feeTrend.title', { defaultValue: 'Fee Collection Trend' })}
            subtitle={t('admin.feeTrend.subtitle', { defaultValue: 'Last 7 days' })}
          />
        </View>
      ) : null}

      <View
        style={[
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.lg,
          },
        ]}
      >
        <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
          {t('admin.quickActions', { defaultValue: 'Quick Actions' })}
        </Text>
        {canMarkAttendance ? (
        <DashboardActionRow
          title={t('admin.action.takeAttendance', { defaultValue: 'Take Attendance' })}
          subtitle={t('admin.action.takeAttendanceSub', { defaultValue: "Mark today's classes" })}
          iconName="checkmark-done-outline"
          iconChipBg="primaryContainer"
          iconChipFg="onPrimaryContainer"
          onPress={() => router.push('/(protected)/attendance/overview')}
        />
        ) : null}
        {canAddStudent ? (
        <DashboardActionRow
          title={t('admin.action.addStudent', { defaultValue: 'Add Student' })}
          subtitle={t('admin.action.addStudentSub', { defaultValue: 'Enroll a new student' })}
          iconName="person-add-outline"
          iconChipBg="secondaryContainer"
          iconChipFg="onSecondaryContainer"
          onPress={() => router.push('/(protected)/students/new')}
        />
        ) : null}
        {canRecordPayment ? (
        <DashboardActionRow
          title={t('admin.action.recordPayment', { defaultValue: 'Record Payment' })}
          subtitle={t('admin.action.recordPaymentSub', { defaultValue: 'Log a fee collection' })}
          iconName="wallet-outline"
          iconChipBg="tertiaryContainer"
          iconChipFg="onTertiaryContainer"
          onPress={() => setRecordPaymentVisible(true)}
        />
        ) : null}
        {canAnnounce ? (
        <DashboardActionRow
          title={t('admin.action.announcements', { defaultValue: 'Announcements' })}
          subtitle={t('admin.action.announcementsSub', { defaultValue: 'Send a notice' })}
          iconName="megaphone-outline"
          iconChipBg="surfaceContainerHigh"
          iconChipFg="onSurfaceVariant"
          onPress={() => router.push('/(protected)/announcements')}
        />
        ) : null}
      </View>

      <View
        style={[
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.lg,
          },
        ]}
      >
        <Text variant="headlineMd" color="onSurface">
          {t('admin.needsAttention', { defaultValue: 'Needs attention' })}
        </Text>
        {!alerts || alerts.total_issues === 0 ? (
          <EmptyState
            icon={<AppIcon name="checkmark-circle" size="xl" color="success" />}
            title={t('admin.allClear', { defaultValue: 'All clear today' })}
          />
        ) : (
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {alertRows.map((row, idx) => (
              <View
                key={idx}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              >
                <View
                  style={{
                    backgroundColor: palette.errorContainer,
                    borderRadius: radius.lg,
                    padding: spacing.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="alert-circle-outline" size="md" color="onErrorContainer" />
                </View>
                <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }} numberOfLines={2}>
                  {row.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {recordPaymentVisible ? (
        <RecordPaymentPicker
          visible={recordPaymentVisible}
          onClose={() => setRecordPaymentVisible(false)}
        />
      ) : null}
    </ScrollView>
  );
}
