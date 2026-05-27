import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/common/theme';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useStudentAcademicDashboard } from '@/modules/academics/hooks/useAcademicQueries';
import { useNotificationsList } from '@/modules/notifications/hooks/useNotifications';
import { HomeSectionHeader } from './HomeSectionHeader';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { Button } from '@/common/components/Button';

function CircularProgress({ value, size, palette }: { value: number; size: number; palette: any }) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={palette.surfaceContainerHighest}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={palette.primary}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export function StudentHome() {
  const { t } = useTranslation('home');
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { user, isFeatureEnabled } = useAuth() as any;
  const { data, isLoading, isRefetching, refetch } = useStudentAcademicDashboard();
  // Gate the notifications query on the feature flag so tenants with the
  // module disabled don't fire wasted 4xx/empty fetches.
  const notificationsEnabled = !!isFeatureEnabled?.('notifications');
  const { data: notifsData } = useNotificationsList(false, notificationsEnabled);

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || '';

  const upNext = (data as any)?.next_class;
  const attendancePct = (data as any)?.attendance?.percentage ?? 0;
  const attendanceTarget = (data as any)?.attendance?.target ?? 85;
  const pendingFeesAmount = (data as any)?.fees?.pending_amount;
  const pendingFeesDays = (data as any)?.fees?.days_until_due;

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
        <Text style={[typography.bodyLg, { color: palette.onSurfaceVariant }]}>
          {t('student.welcomeBack', { defaultValue: 'Welcome back,' })}
        </Text>
        <Text style={[typography.display, { color: palette.onSurface, marginTop: spacing.xs }]}>
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
                <Text style={[typography.labelSm, { color: palette.primary }]}>
                  {t('student.upNext', { defaultValue: 'Up Next' })}
                </Text>
              </View>
              <Text
                style={[typography.headlineMd, { color: palette.onSurface }]}
                numberOfLines={1}
              >
                {String(upNext?.subject?.name ?? upNext?.subject ?? '—')}
              </Text>
            </View>
            <Ionicons name="calculator-outline" size={28} color={palette.primary} />
          </View>
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={18} color={palette.onSurfaceVariant} />
              <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
                {upNext?.start_time} - {upNext?.end_time}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location-outline" size={18} color={palette.onSurfaceVariant} />
              <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
                {String(upNext?.room ?? '—')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="person-outline" size={18} color={palette.onSurfaceVariant} />
              <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
                {String(upNext?.teacher?.name ?? '—')}
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
            icon={<Ionicons name="cafe-outline" size={36} color={palette.onSurfaceVariant} />}
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
            <Text
              style={[
                typography.labelSm,
                { color: palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
              ]}
            >
              {t('student.attendance', { defaultValue: 'Attendance' })}
            </Text>
            <Text style={[typography.headlineLg, { color: palette.primary, marginTop: 4 }]}>
              {attendancePct}%
            </Text>
            <Text style={[typography.labelSm, { color: palette.outline, marginTop: 4 }]}>
              {t('student.target', { defaultValue: 'Target: {{n}}%', n: attendanceTarget })}
            </Text>
          </View>
          <CircularProgress value={Number(attendancePct)} size={64} palette={palette} />
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
            <Text
              style={[
                typography.labelSm,
                { color: palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
              ]}
            >
              {pendingFeesAmount
                ? t('student.pendingFees', { defaultValue: 'Pending Fees' })
                : t('student.feesClear', { defaultValue: 'Fees Clear' })}
            </Text>
            <Text
              style={[
                typography.headlineLg,
                { color: pendingFeesAmount ? palette.error : palette.success, marginTop: 4 },
              ]}
              numberOfLines={1}
            >
              {pendingFeesAmount ? `₹${pendingFeesAmount}` : t('student.noFeesDue', { defaultValue: 'All paid' })}
            </Text>
            {pendingFeesDays != null ? (
              <Text style={[typography.labelSm, { color: palette.outline, marginTop: 4 }]} numberOfLines={1}>
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
            <Ionicons
              name="wallet-outline"
              size={20}
              color={pendingFeesAmount ? palette.onErrorContainer : palette.success}
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
              icon={<Ionicons name="mail-open-outline" size={36} color={palette.onSurfaceVariant} />}
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
                    <Ionicons name="notifications" size={16} color={palette.onSecondaryContainer} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.labelMd, { color: palette.onSurface }]} numberOfLines={1}>
                      {String(n?.title ?? n?.subject ?? '—')}
                    </Text>
                    <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
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

const styles = StyleSheet.create({});
