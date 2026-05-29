import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useAdminAcademicDashboard } from '@/modules/academics/hooks/useAcademicQueries';
import { HomeKpiCard } from './HomeKpiCard';
import { HomeQuickActionCard } from './HomeQuickActionCard';
import { HomeSectionHeader } from './HomeSectionHeader';
import { RecordPaymentPicker } from './RecordPaymentPicker';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';

function showComingSoon(label: string) {
  Alert.alert(label, 'Coming soon');
}

export function AdminHome() {
  const { t } = useTranslation('home');
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useAdminAcademicDashboard();
  const [recordPaymentVisible, setRecordPaymentVisible] = React.useState(false);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const studentsTotal = (data as any)?.students?.total ?? '—';
  const teachersTotal = (data as any)?.teachers?.total ?? '—';
  const attendancePct = (data as any)?.attendance?.today_percentage;
  const feesToday = (data as any)?.fees?.today_amount;
  const conflicts: any[] = (data as any)?.timetable_conflicts ?? [];

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 3,
      }}
      refreshControl={
        <RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" color="onSurface">
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
          <Skeleton width="48%" height={110} radius={radius.xl} />
          <Skeleton width="48%" height={110} radius={radius.xl} />
          <Skeleton width="48%" height={110} radius={radius.xl} />
          <Skeleton width="48%" height={110} radius={radius.xl} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <View style={{ width: '48%' }}>
            <HomeKpiCard
              label={t('admin.kpi.students', { defaultValue: 'Total Students' })}
              value={String(studentsTotal)}
              accent="primary"
              iconName="school-outline"
              iconBgToken="primaryContainer"
            />
          </View>
          <View style={{ width: '48%' }}>
            <HomeKpiCard
              label={t('admin.kpi.teachers', { defaultValue: 'Total Teachers' })}
              value={String(teachersTotal)}
              accent="tertiary"
              iconName="people-circle-outline"
              iconBgToken="tertiaryContainer"
            />
          </View>
          <View style={{ width: '48%' }}>
            <HomeKpiCard
              label={t('admin.kpi.attendance', { defaultValue: 'Attendance Today' })}
              value={attendancePct != null ? `${attendancePct}%` : '—'}
              accent="secondary"
              iconName="checkmark-done-outline"
              iconBgToken="secondaryContainer"
            />
          </View>
          <View style={{ width: '48%' }}>
            <HomeKpiCard
              label={t('admin.kpi.fees', { defaultValue: "Today's Collection" })}
              value={feesToday != null ? `₹${feesToday}` : '—'}
              accent="success"
              iconName="wallet-outline"
              iconBgToken="surfaceContainerHigh"
            />
          </View>
        </View>
      )}

      <View style={{ gap: spacing.md }}>
        <HomeSectionHeader title={t('admin.quickActions', { defaultValue: 'Quick Actions' })} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
        >
          <View style={{ width: 140 }}>
            <HomeQuickActionCard
              label={t('admin.action.takeAttendance', { defaultValue: 'Take Attendance' })}
              iconName="checkmark-done"
              iconBgToken="primaryContainer"
              iconFgToken="onPrimaryContainer"
              onPress={() => router.push('/(protected)/attendance/overview')}
            />
          </View>
          <View style={{ width: 140 }}>
            <HomeQuickActionCard
              label={t('admin.action.addStudent', { defaultValue: 'Add Student' })}
              iconName="person-add"
              iconBgToken="secondaryContainer"
              iconFgToken="onSecondaryContainer"
              onPress={() => router.push('/(protected)/students/new')}
            />
          </View>
          <View style={{ width: 140 }}>
            <HomeQuickActionCard
              label={t('admin.action.recordPayment', { defaultValue: 'Record Payment' })}
              iconName="wallet-outline"
              iconBgToken="tertiaryContainer"
              iconFgToken="onTertiaryContainer"
              onPress={() => setRecordPaymentVisible(true)}
            />
          </View>
          <View style={{ width: 140 }}>
            <HomeQuickActionCard
              label={t('admin.action.sendNotice', { defaultValue: 'Send Notice' })}
              iconName="megaphone"
              iconBgToken="tertiaryContainer"
              iconFgToken="onTertiaryContainer"
              onPress={() => showComingSoon(t('admin.action.sendNotice', { defaultValue: 'Send Notice' }))}
            />
          </View>
          <View style={{ width: 140 }}>
            <HomeQuickActionCard
              label={t('admin.action.reports', { defaultValue: 'View Reports' })}
              iconName="document-text"
              iconBgToken="surfaceContainerHigh"
              iconFgToken="onSurfaceVariant"
              onPress={() => showComingSoon(t('admin.action.reports', { defaultValue: 'View Reports' }))}
            />
          </View>
        </ScrollView>
      </View>

      <View style={{ gap: spacing.md }}>
        <HomeSectionHeader title={t('admin.conflicts', { defaultValue: "Today's Conflicts" })} />
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              overflow: 'hidden',
            },
          ]}
        >
          {conflicts.length > 0 ? (
            conflicts.slice(0, 5).map((c, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  gap: spacing.md,
                  borderBottomWidth: idx < Math.min(conflicts.length, 5) - 1 ? 1 : 0,
                  borderBottomColor: palette.surfaceContainerHigh,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: palette.errorContainer,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="alert-circle-outline" size="md" color="onErrorContainer" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelMd" color="onSurface" numberOfLines={1}>
                    {String(c?.title ?? c?.description ?? 'Conflict')}
                  </Text>
                </View>
                <AppIcon name="chevron-forward" size="sm" color="primary" />
              </View>
            ))
          ) : (
            <EmptyState
              icon={<AppIcon name="checkmark-circle" size="xl" color="success" />}
              title={t('admin.noConflicts', { defaultValue: 'No conflicts today' })}
            />
          )}
        </View>
      </View>

      {isLoading && !data ? (
        <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : null}

      {recordPaymentVisible ? (
        <RecordPaymentPicker
          visible={recordPaymentVisible}
          onClose={() => setRecordPaymentVisible(false)}
        />
      ) : null}
    </ScrollView>
  );
}
