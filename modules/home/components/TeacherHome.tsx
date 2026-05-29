import React from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useTeacherTodaySchedule } from '@/modules/academics/hooks/useAcademicQueries';
import { getTimeOfDayGreeting } from '@/common/utils/greeting';
import { HomeQuickActionCard } from './HomeQuickActionCard';
import { HomeSectionHeader } from './HomeSectionHeader';
import { EmptyState } from '@/common/components/EmptyState';
import { Button } from '@/common/components/Button';

function showComingSoon(label: string) {
  Alert.alert(label, 'Coming soon');
}

type PeriodStatus = 'ongoing' | 'next' | 'later';

function periodStatus(start: string, end: string, now = new Date()): PeriodStatus {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = new Date(now);
  s.setHours(sh, sm, 0, 0);
  const e = new Date(now);
  e.setHours(eh, em, 0, 0);
  if (now >= s && now <= e) return 'ongoing';
  if (now < s) return 'next';
  return 'later';
}

export function TeacherHome() {
  const { t } = useTranslation('home');
  const { palette, spacing, radius, elevation } = useTheme();
  const { user } = useAuth() as any;
  const { data, isRefetching, refetch } = useTeacherTodaySchedule();

  const greeting = getTimeOfDayGreeting(t);
  const firstName = user?.first_name ?? user?.name?.split(' ')?.[0] ?? '';

  const periods: any[] = (data as any)?.periods ?? [];
  const ordered = [...periods].sort((a, b) =>
    String(a.start_time).localeCompare(String(b.start_time))
  );
  const now = new Date();
  let nextAssigned = false;
  const labeled = ordered.map((p) => {
    const s = periodStatus(p.start_time, p.end_time, now);
    if (s === 'next' && nextAssigned) return { ...p, _status: 'later' as PeriodStatus };
    if (s === 'next') {
      nextAssigned = true;
      return { ...p, _status: 'next' as PeriodStatus };
    }
    return { ...p, _status: s };
  });

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.xl,
        paddingBottom: spacing.xl * 3,
      }}
      refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" color="onSurface">
          {t('teacher.greeting', {
            defaultValue: '{{greeting}}, {{name}}',
            greeting,
            name: firstName,
          })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t('teacher.subtitle', { defaultValue: 'Here is your schedule and tasks for today.' })}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <View style={{ width: '48%' }}>
          <HomeQuickActionCard
            label={t('teacher.action.markAttendance', { defaultValue: 'Mark Attendance' })}
            iconName="checkmark-done"
            iconBgToken="primaryContainer"
            iconFgToken="onPrimaryContainer"
            onPress={() => router.push('/(protected)/attendance/my-classes')}
          />
        </View>
        <View style={{ width: '48%' }}>
          <HomeQuickActionCard
            label={t('teacher.action.addAssignment', { defaultValue: 'Add Assignment' })}
            iconName="clipboard"
            iconBgToken="secondaryContainer"
            iconFgToken="onSecondaryContainer"
            onPress={() => showComingSoon(t('teacher.action.addAssignment', { defaultValue: 'Add Assignment' }))}
          />
        </View>
        <View style={{ width: '48%' }}>
          <HomeQuickActionCard
            label={t('teacher.action.mySchedule', { defaultValue: 'My Schedule' })}
            iconName="calendar"
            iconBgToken="tertiaryContainer"
            iconFgToken="onTertiaryContainer"
            onPress={() => router.push('/(protected)/schedule/today')}
          />
        </View>
        <View style={{ width: '48%' }}>
          <HomeQuickActionCard
            label={t('teacher.action.more', { defaultValue: 'More Actions' })}
            iconName="add"
            iconBgToken="surfaceContainerHigh"
            iconFgToken="onSurfaceVariant"
            onPress={() => showComingSoon(t('teacher.action.more', { defaultValue: 'More Actions' }))}
            dashed
          />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <HomeSectionHeader
          title={t('teacher.todaysPeriods', { defaultValue: "Today's Periods" })}
          viewAllLabel={t('viewAll', { defaultValue: 'View All' })}
          onViewAll={() => router.push('/(protected)/schedule/today')}
        />
        {labeled.length === 0 ? (
          <View
            style={[
              elevation.card,
              { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
            ]}
          >
            <EmptyState
              icon={<AppIcon name="cafe-outline" size="xl" color="onSurfaceVariant" />}
              title={t('teacher.noPeriods', { defaultValue: 'No classes today' })}
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
          >
            {labeled.map((p, idx) => {
              const status: PeriodStatus = p._status;
              const isOngoing = status === 'ongoing';
              const accentColor =
                status === 'next' ? palette.secondary : palette.outlineVariant;
              return (
                <View
                  key={idx}
                  style={[
                    elevation.card,
                    {
                      minWidth: 280,
                      backgroundColor: isOngoing ? palette.primary : palette.surfaceContainerLowest,
                      borderRadius: radius.xl,
                      padding: spacing.lg,
                      ...(isOngoing
                        ? {}
                        : { borderLeftWidth: 4, borderLeftColor: accentColor }),
                      opacity: status === 'later' ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: isOngoing
                          ? palette.onPrimary
                          : palette.surfaceContainer,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text variant="overline" color={isOngoing ? 'primary' : 'onSurfaceVariant'}>
                        {status}
                      </Text>
                    </View>
                    <Text
                      variant="labelMd"
                      color={isOngoing ? 'onPrimary' : 'onSurfaceVariant'}
                      style={{ opacity: isOngoing ? 0.9 : 1 }}
                    >
                      {p.start_time} - {p.end_time}
                    </Text>
                  </View>
                  <Text
                    variant="headlineLg"
                    color={isOngoing ? 'onPrimary' : 'onSurface'}
                    style={{ marginBottom: spacing.xs }}
                    numberOfLines={1}
                  >
                    {String(p.subject?.name ?? p.subject ?? '—')}
                  </Text>
                  <Text
                    variant="bodyMd"
                    color={isOngoing ? 'onPrimary' : 'onSurfaceVariant'}
                    style={{ opacity: isOngoing ? 0.9 : 1 }}
                    numberOfLines={1}
                  >
                    {[p.class_section?.name ?? p.class_name, p.room].filter(Boolean).join(' • ')}
                  </Text>
                  {isOngoing ? (
                    <View style={{ marginTop: spacing.md }}>
                      {/* Sits on the indigo primary card. Use `secondary` so the
                          label inherits `palette.primary` (indigo) which
                          contrasts against the white background override. */}
                      <Button
                        variant="secondary"
                        size="md"
                        fullWidth
                        onPress={() => router.push('/(protected)/attendance/my-classes')}
                        style={{ backgroundColor: palette.onPrimary }}
                      >
                        {t('teacher.startLesson', { defaultValue: 'Start Lesson' })}
                      </Button>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}
