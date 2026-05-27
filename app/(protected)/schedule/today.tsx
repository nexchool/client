import React, { useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  useTeacherTodaySchedule,
  useStudentAcademicDashboard,
} from '@/modules/academics/hooks/useAcademicQueries';
import { EmptyState } from '@/common/components/EmptyState';
import { Skeleton } from '@/common/components/Skeleton';
import { Protected } from '@/modules/permissions/components/Protected';
import { ScheduleOverrideSheet } from '@/modules/schedule/components/ScheduleOverrideSheet';

const DAYS_BACK = 3;
const DAYS_FORWARD = 3;

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
  const { palette, spacing, radius, typography } = useTheme();
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

  let body: React.ReactNode;
  if (role.isTeacher) {
    body = <TeacherSchedule data={teacherQuery.data} loading={!!teacherQuery.isLoading} />;
  } else if (role.isAdmin) {
    body = <AdminEvents />;
  } else {
    body = <StudentSchedule data={studentQuery.data} loading={!!studentQuery.isLoading} />;
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
        paddingBottom: spacing.xl * 3,
      }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.display, { color: palette.onSurface }]}>
            {t('title', { defaultValue: 'Schedule' })}
          </Text>
          <Text
            style={[
              typography.bodyMd,
              { color: palette.onSurfaceVariant, marginTop: spacing.xs },
            ]}
          >
            {today.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Protected anyPermissions={['schedule.override', 'schedule.manage', 'teacher.manage', 'timetable.manage']}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('override.openButton', { defaultValue: 'Add schedule override' })}
            onPress={() => setOverrideSheetVisible(true)}
            hitSlop={12}
            style={{ marginLeft: 12, padding: 8 }}
          >
            <Ionicons name="add" size={24} color={palette.onSurface} />
          </Pressable>
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
            <Text
              key={d.label}
              onPress={() => onDayTap(d.label, d.isToday)}
              style={[
                typography.labelMd,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: isSelected
                    ? palette.primaryContainer
                    : palette.surfaceContainerLowest,
                  color: isSelected ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                  overflow: 'hidden',
                  fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                },
              ]}
            >
              {d.label}
            </Text>
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

function TeacherSchedule({ data, loading }: { data: any; loading: boolean }) {
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { t } = useTranslation('schedule');
  if (loading && !data) return <Skeleton width="100%" height={200} radius={radius.xl} />;
  const periods: any[] = data?.periods ?? [];
  if (periods.length === 0) {
    return (
      <View
        style={[
          elevation.card,
          { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
        ]}
      >
        <EmptyState
          icon={<Ionicons name="cafe-outline" size={36} color={palette.onSurfaceVariant} />}
          title={t('noPeriods', { defaultValue: 'No classes today' })}
        />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      {periods.map((p, idx) => (
        <View
          key={idx}
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: palette.secondary,
            },
          ]}
        >
          <Text
            style={[
              typography.labelSm,
              {
                color: palette.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 1,
              },
            ]}
          >
            {p.start_time} - {p.end_time}
          </Text>
          <Text
            style={[typography.headlineMd, { color: palette.onSurface, marginTop: 4 }]}
            numberOfLines={1}
          >
            {String(p.subject?.name ?? p.subject ?? '—')}
          </Text>
          <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
            {[p.class_section?.name ?? p.class_name, p.room].filter(Boolean).join(' • ')}
          </Text>
        </View>
      ))}
    </View>
  );
}

function StudentSchedule({ data, loading }: { data: any; loading: boolean }) {
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { t } = useTranslation('schedule');
  if (loading && !data) return <Skeleton width="100%" height={200} radius={radius.xl} />;
  const periods: any[] = data?.today_schedule ?? data?.periods ?? [];
  if (periods.length === 0) {
    return (
      <View
        style={[
          elevation.card,
          { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
        ]}
      >
        <EmptyState
          icon={<Ionicons name="cafe-outline" size={36} color={palette.onSurfaceVariant} />}
          title={t('noClasses', { defaultValue: 'No classes today' })}
        />
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      {periods.map((p, idx) => (
        <View
          key={idx}
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: palette.primary,
            },
          ]}
        >
          <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
            {p.start_time} - {p.end_time}
          </Text>
          <Text
            style={[typography.headlineMd, { color: palette.onSurface, marginTop: 4 }]}
            numberOfLines={1}
          >
            {String(p.subject?.name ?? '—')}
          </Text>
          <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
            {[p.room, p.teacher?.name].filter(Boolean).join(' • ')}
          </Text>
        </View>
      ))}
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
        icon={<Ionicons name="calendar-outline" size={36} color={palette.onSurfaceVariant} />}
        title={t('admin.noEvents', { defaultValue: 'No scheduled events today' })}
        description={t('admin.noEventsHelp', {
          defaultValue: 'School-wide events will appear here when scheduled.',
        })}
      />
    </View>
  );
}
