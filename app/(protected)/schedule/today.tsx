import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useTheme } from '@/common/theme';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  useTeacherTodaySchedule,
  useStudentAcademicDashboard,
} from '@/modules/academics/hooks/useAcademicQueries';
import { AppIcon } from '@/common/components/AppIcon';
import { Text } from '@/common/components/Text';
import { PressScale } from '@/common/components/PressScale';
import { EmptyState } from '@/common/components/EmptyState';
import { Skeleton } from '@/common/components/Skeleton';
import { Protected } from '@/modules/permissions/components/Protected';
import { ScheduleOverrideSheet } from '@/modules/schedule/components/ScheduleOverrideSheet';

const DAYS_BACK = 3;
const DAYS_FORWARD = 3;

/**
 * A single rendered period. Sourced from the server `_serialize_entry` shape:
 * `subject_name`, `teacher_name`, `room`, `period_number`, and bell times
 * `starts_at`/`ends_at` ("HH:MM:SS" or null). Teacher schedule also adds
 * `class_name`.
 */
type SchedulePeriod = {
  subject_name?: string | null;
  teacher_name?: string | null;
  room?: string | null;
  class_name?: string | null;
  period_number?: number | null;
  period_label?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

type PeriodStatus = 'past' | 'ongoing' | 'upcoming';

function buildDayStrip(today: Date) {
  const out: { date: Date; label: string; isToday: boolean }[] = [];
  for (let i = -DAYS_BACK; i <= DAYS_FORWARD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      isToday: i === 0,
    });
  }
  return out;
}

/** "HH:MM:SS" / "HH:MM" → minutes since midnight, or null. */
function toMinutes(t?: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** "HH:MM:SS" / "HH:MM" → "HH:MM", or "—". */
function shortTime(t?: string | null): string {
  if (!t) return '—';
  return t.slice(0, 5);
}

function statusOf(p: SchedulePeriod, nowMins: number): PeriodStatus {
  const start = toMinutes(p.starts_at);
  const end = toMinutes(p.ends_at);
  if (start === null || end === null) return 'upcoming';
  if (nowMins >= end) return 'past';
  if (nowMins >= start && nowMins < end) return 'ongoing';
  return 'upcoming';
}

export default function ScheduleTodayPage() {
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();

  useEffect(() => {
    if (!isFeatureEnabled('timetable')) {
      router.replace('/(protected)/home');
    }
  }, [isFeatureEnabled, router]);

  if (!isFeatureEnabled('timetable')) {
    return null;
  }

  return <ScheduleTodayScreen />;
}

function ScheduleTodayScreen() {
  const { t } = useTranslation('schedule');
  const { palette, spacing, radius } = useTheme();
  const role = useUiRole();
  const today = new Date();
  const [selectedDayLabel, setSelectedDayLabel] = useState(
    today.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
  );
  const [overrideSheetVisible, setOverrideSheetVisible] = useState(false);

  const teacherQuery = useTeacherTodaySchedule(role.isTeacher);
  const studentQuery = useStudentAcademicDashboard(!role.isTeacher && !role.isAdmin);

  const dayStrip = buildDayStrip(today);

  const onDayTap = (label: string, isToday: boolean) => {
    if (isToday) {
      setSelectedDayLabel(label);
      return;
    }
    Alert.alert(label, t('comingSoon', { defaultValue: 'Coming soon' }));
  };

  // Teacher endpoint → { date, lectures, next_lecture }; student dashboard → { today_schedule }.
  const teacherPeriods: SchedulePeriod[] = (teacherQuery.data as any)?.lectures ?? [];
  const studentPeriods: SchedulePeriod[] =
    (studentQuery.data as any)?.today_schedule ?? [];

  let body: React.ReactNode;
  if (role.isTeacher) {
    body = (
      <ScheduleTimeline
        periods={teacherPeriods}
        loading={!!teacherQuery.isLoading && !teacherQuery.data}
        secondary="class"
        emptyTitle={t('noPeriods', { defaultValue: 'No classes today' })}
      />
    );
  } else if (role.isAdmin) {
    body = <AdminEvents />;
  } else {
    body = (
      <ScheduleTimeline
        periods={studentPeriods}
        loading={!!studentQuery.isLoading && !studentQuery.data}
        secondary="teacher"
        emptyTitle={t('noClasses', { defaultValue: 'No classes today' })}
      />
    );
  }

  const isRefetching = role.isTeacher
    ? !!teacherQuery.isRefetching
    : role.isAdmin
      ? false
      : !!studentQuery.isRefetching;
  const refetch = role.isTeacher
    ? teacherQuery.refetch
    : role.isAdmin
      ? () => {}
      : studentQuery.refetch;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.scrollBottom,
      }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text variant="display" color="onSurface">
            {t('title', { defaultValue: 'Schedule' })}
          </Text>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
            {today.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Protected anyPermissions={['schedule.override', 'schedule.manage', 'teacher.manage', 'timetable.manage']}>
          <AppIcon
            name="add"
            size="lg"
            color="onSurface"
            onPress={() => setOverrideSheetVisible(true)}
            accessibilityLabel={t('override.openButton', { defaultValue: 'Add schedule override' })}
            style={{ marginLeft: spacing.md, padding: spacing.sm }}
          />
        </Protected>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {dayStrip.map((d) => {
          const isSelected = d.label === selectedDayLabel;
          return (
            <PressScale
              key={d.label}
              onPress={() => onDayTap(d.label, d.isToday)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: isSelected
                  ? palette.primaryContainer
                  : palette.surfaceContainerLowest,
              }}
            >
              <Text
                variant="labelMd"
                color={isSelected ? 'onPrimaryContainer' : 'onSurfaceVariant'}
              >
                {d.label}
              </Text>
            </PressScale>
          );
        })}
      </ScrollView>

      {body}

      <ScheduleOverrideSheet
        visible={overrideSheetVisible}
        onClose={() => setOverrideSheetVisible(false)}
      />
    </ScrollView>
  );
}

function ScheduleTimeline({
  periods,
  loading,
  secondary,
  emptyTitle,
}: {
  periods: SchedulePeriod[];
  loading: boolean;
  secondary: 'class' | 'teacher';
  emptyTitle: string;
}) {
  const { palette, spacing, radius, elevation } = useTheme();

  if (loading) return <Skeleton width="100%" height={220} radius={radius.xl} />;

  if (periods.length === 0) {
    return (
      <View
        style={[
          elevation.card,
          { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
        ]}
      >
        <EmptyState
          icon={<AppIcon name="cafe-outline" size="xl" color="onSurfaceVariant" />}
          title={emptyTitle}
        />
      </View>
    );
  }

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <View style={{ gap: spacing.md }}>
      {periods.map((p, idx) => (
        <PeriodTimelineRow
          key={`${p.period_number ?? idx}-${idx}`}
          period={p}
          status={statusOf(p, nowMins)}
          secondary={secondary}
          isLast={idx === periods.length - 1}
        />
      ))}
    </View>
  );
}

function initialOf(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function PeriodTimelineRow({
  period,
  status,
  secondary,
  isLast,
}: {
  period: SchedulePeriod;
  status: PeriodStatus;
  secondary: 'class' | 'teacher';
  isLast: boolean;
}) {
  const { t } = useTranslation('schedule');
  const { palette, spacing, radius } = useTheme();
  const ongoing = status === 'ongoing';
  const past = status === 'past';

  const secondaryName =
    secondary === 'teacher' ? period.teacher_name : period.class_name;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      {/* Timeline rail */}
      <View style={{ width: 48, alignItems: 'center' }}>
        <View
          style={{
            width: ongoing ? 14 : 10,
            height: ongoing ? 14 : 10,
            borderRadius: 7,
            marginTop: 6,
            backgroundColor: ongoing
              ? palette.primary
              : past
                ? palette.outlineVariant
                : palette.surfaceContainerHighest,
          }}
        />
        {!isLast ? (
          <View
            style={{
              flex: 1,
              width: 2,
              marginTop: 4,
              backgroundColor: palette.surfaceContainer,
            }}
          />
        ) : null}
        <Text
          variant="labelSm"
          color={ongoing ? 'primary' : 'onSurfaceVariant'}
          style={{ marginTop: 6 }}
        >
          {shortTime(period.starts_at)}
        </Text>
      </View>

      {/* Card */}
      <View
        style={{
          flex: 1,
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: ongoing ? 2 : 1,
          borderColor: ongoing ? palette.primary : palette.surfaceContainerHigh,
          borderLeftWidth: ongoing ? 2 : 4,
          borderLeftColor: ongoing ? palette.primary : palette.secondary,
          opacity: past ? 0.7 : 1,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text
            variant={ongoing ? 'headlineMd' : 'titleSm'}
            color="onSurface"
            style={{ flex: 1 }}
            numberOfLines={1}
          >
            {period.subject_name ?? '—'}
          </Text>
          {ongoing ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: palette.primary,
                borderRadius: radius.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
              }}
            >
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.onPrimary }}
              />
              <Text variant="labelSm" color="onPrimary">
                {t('ongoing', { defaultValue: 'Ongoing' })}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppIcon name="time-outline" size="sm" color={ongoing ? 'primary' : 'onSurfaceVariant'} />
            <Text variant="labelMd" color={ongoing ? 'primary' : 'onSurfaceVariant'}>
              {shortTime(period.starts_at)} - {shortTime(period.ends_at)}
            </Text>
          </View>
          {period.room ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppIcon name="location-outline" size="sm" color="onSurfaceVariant" />
              <Text variant="labelMd" color="onSurfaceVariant">
                {period.room}
              </Text>
            </View>
          ) : null}
        </View>

        {secondaryName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.tertiaryContainer,
              }}
            >
              <Text variant="labelSm" color="onTertiaryContainer">
                {initialOf(secondaryName)}
              </Text>
            </View>
            <Text variant="labelMd" color="onSurfaceVariant" numberOfLines={1} style={{ flex: 1 }}>
              {secondaryName}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function AdminEvents() {
  const { palette, radius, elevation } = useTheme();
  const { t } = useTranslation('schedule');
  return (
    <View
      style={[
        elevation.card,
        { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
      ]}
    >
      <EmptyState
        icon={<AppIcon name="calendar-outline" size="xl" color="onSurfaceVariant" />}
        title={t('admin.noEvents', { defaultValue: 'No scheduled events today' })}
        description={t('admin.noEventsHelp', {
          defaultValue: 'School-wide events will appear here when scheduled.',
        })}
      />
    </View>
  );
}
