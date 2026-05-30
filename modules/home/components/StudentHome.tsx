import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useStudentAcademicDashboard } from '@/modules/academics/hooks/useAcademicQueries';
import { useNotificationsList } from '@/modules/notifications/hooks/useNotifications';
import { HomeSectionHeader } from './HomeSectionHeader';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { Button } from '@/common/components/Button';
import { ProgressRing } from './ProgressRing';

// "08:00:00" -> "08:00"; null/empty -> "".
function hhmm(value: string | null | undefined): string {
  if (!value) return '';
  const [h, m] = value.split(':');
  return h && m ? `${h}:${m}` : value;
}

// Minutes since midnight for an "HH:MM:SS" string; null if unparseable.
function minutesOfDay(value: string | null | undefined): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function StudentHome() {
  const { t } = useTranslation('home');
  const { palette, spacing, radius, elevation } = useTheme();
  const { user, isFeatureEnabled } = useAuth() as any;
  const { data, isLoading, isRefetching, refetch } = useStudentAcademicDashboard();
  // Gate the notifications query on the feature flag so tenants with the
  // module disabled don't fire wasted 4xx/empty fetches.
  const notificationsEnabled = !!isFeatureEnabled?.('notifications');
  const { data: notifsData } = useNotificationsList(false, notificationsEnabled);

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || '';

  // Up Next: from today's schedule, pick the earliest period whose end time is
  // still >= now. Periods without bell-schedule times can't be ranked, so they
  // are skipped here. Falls back to null -> "No more classes today" empty state.
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upNext =
    (data?.today_schedule ?? [])
      .filter((p) => {
        const end = minutesOfDay(p.ends_at);
        return end != null && end >= nowMinutes;
      })
      .sort((a, b) => (minutesOfDay(a.starts_at) ?? 0) - (minutesOfDay(b.starts_at) ?? 0))[0] ??
    null;

  const attendancePct = data?.attendance_summary?.percentage ?? 0;
  const attendanceTarget = 85;

  // NOTE: /api/finance/student-fees requires finance.read/manage/collect, which
  // the Student role does NOT hold — calling it from a student session returns
  // 403. So we render a neutral fees state rather than firing a failing query.
  const pendingFeesAmount: number | undefined = undefined;
  const pendingFeesDays: number | null = null;

  // Notification list shape may be `Notification[]` or `{ results: [] }` or paginated.
  // Flatten defensively.
  const rawNotifs: any =
    Array.isArray(notifsData) ? notifsData :
    (notifsData as any)?.results ??
    (notifsData as any)?.items ??
    (notifsData as any)?.pages?.flatMap((p: any) => p.results ?? p.items ?? []) ??
    [];
  const updates: any[] = Array.isArray(rawNotifs) ? rawNotifs.slice(0, 3) : [];

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 3,
      }}
      refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="bodyLg" color="onSurfaceVariant">
          {t('student.welcomeBack', { defaultValue: 'Welcome back,' })}
        </Text>
        <Text variant="display" color="onSurface" style={{ marginTop: spacing.xs }}>
          {fullName}
        </Text>
      </View>

      {isLoading && !data ? (
        <Skeleton width="100%" height={200} radius={radius.xl} />
      ) : upNext ? (
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: palette.primary,
              overflow: 'hidden',
            },
          ]}
        >
          <View
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 128,
              height: 128,
              borderRadius: 64,
              backgroundColor: palette.primaryContainer,
              opacity: 0.2,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: spacing.md,
            }}
          >
            <View>
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: palette.surfaceContainerHigh,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: radius.full,
                  marginBottom: spacing.xs,
                }}
              >
                <Text variant="labelSm" color="primary">
                  {t('student.upNext', { defaultValue: 'Up Next' })}
                </Text>
              </View>
              <Text variant="headlineMd" color="onSurface" numberOfLines={1}>
                {upNext?.subject_name ?? '—'}
              </Text>
            </View>
            <AppIcon name="calculator-outline" size="lg" color="primary" />
          </View>
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcon name="time-outline" size="sm" color="onSurfaceVariant" />
              <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={1}>
                {[hhmm(upNext?.starts_at), hhmm(upNext?.ends_at)].filter(Boolean).join(' - ') || '—'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcon name="location-outline" size="sm" color="onSurfaceVariant" />
              <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={1}>
                {String(upNext?.room ?? '—')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AppIcon name="person-outline" size="sm" color="onSurfaceVariant" />
              <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={1}>
                {upNext?.teacher_name ?? '—'}
              </Text>
            </View>
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: palette.outlineVariant,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="primary"
              size="md"
              onPress={() => router.push('/(protected)/schedule/today')}
            >
              {t('student.viewResources', { defaultValue: 'View Schedule' })}
            </Button>
          </View>
        </View>
      ) : (
        <View
          style={[
            elevation.card,
            { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
          ]}
        >
          <EmptyState
            icon={<AppIcon name="cafe-outline" size="xl" color="onSurfaceVariant" />}
            title={t('student.noMoreClasses', { defaultValue: 'No more classes today' })}
          />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View
          style={[
            elevation.card,
            {
              flex: 1,
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text variant="overline" color="onSurfaceVariant">
              {t('student.attendance', { defaultValue: 'Attendance' })}
            </Text>
            <Text variant="headlineLg" color="primary" style={{ marginTop: 4 }}>
              {attendancePct}%
            </Text>
            <Text variant="labelSm" color="outline" style={{ marginTop: 4 }}>
              {t('student.target', { defaultValue: 'Target: {{n}}%', n: attendanceTarget })}
            </Text>
          </View>
          <ProgressRing value={Number(attendancePct)} size={64} />
        </View>
        <View
          style={[
            elevation.card,
            {
              flex: 1,
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeftWidth: 4,
              borderLeftColor: pendingFeesAmount ? palette.error : palette.success,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text variant="overline" color="onSurfaceVariant">
              {pendingFeesAmount
                ? t('student.pendingFees', { defaultValue: 'Pending Fees' })
                : t('student.feesClear', { defaultValue: 'Fees Clear' })}
            </Text>
            <Text
              variant="headlineLg"
              color={pendingFeesAmount ? 'error' : 'success'}
              style={{ marginTop: 4 }}
              numberOfLines={1}
            >
              {pendingFeesAmount ? `₹${pendingFeesAmount}` : t('student.noFeesDue', { defaultValue: 'All paid' })}
            </Text>
            {pendingFeesDays != null ? (
              <Text variant="labelSm" color="outline" style={{ marginTop: 4 }} numberOfLines={1}>
                {t('student.dueIn', { defaultValue: 'Due in {{n}} days', n: pendingFeesDays })}
              </Text>
            ) : null}
          </View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pendingFeesAmount ? palette.errorContainer : palette.surfaceContainerHigh,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon
              name="wallet-outline"
              size="md"
              color={pendingFeesAmount ? 'onErrorContainer' : 'success'}
            />
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <HomeSectionHeader
          title={t('student.recentUpdates', { defaultValue: 'Recent Updates' })}
          viewAllLabel={t('viewAll', { defaultValue: 'View All' })}
          onViewAll={() => router.push('/(protected)/notifications')}
        />
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
          {updates.length === 0 ? (
            <EmptyState
              icon={<AppIcon name="mail-open-outline" size="xl" color="onSurfaceVariant" />}
              title={t('student.noUpdates', { defaultValue: 'No new updates' })}
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {updates.map((n, idx) => (
                <View
                  key={n?.id ?? idx}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.sm }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: palette.secondaryContainer,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon name="notifications" size="sm" color="onSecondaryContainer" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="labelMd" color="onSurface" numberOfLines={1}>
                      {String(n?.title ?? n?.subject ?? '—')}
                    </Text>
                    <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={1}>
                      {String(n?.body ?? n?.message ?? '')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
