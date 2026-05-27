import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { Link } from '@/common/components/Link';
import {
  useTeacherWeeklyTimetable,
  useStudentWeeklyTimetable,
  useClassWeeklyTimetable,
} from '../hooks/useTimetable';
import { WeeklyGrid } from '../components/WeeklyGrid';

function isoMondayOf(d: Date): string {
  const day = d.getDay() || 7; // Sunday → 7
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  return monday.toISOString().slice(0, 10);
}

function shiftWeek(iso: string, deltaWeeks: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + deltaWeeks * 7);
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (x: Date) => x.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function WeeklyTimetableScreen() {
  const { t } = useTranslation('timetable');
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const role = useUiRole();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = params.classId;

  const [weekStart, setWeekStart] = useState<string>(() => isoMondayOf(new Date()));

  const teacherQuery = useTeacherWeeklyTimetable(weekStart);
  const studentQuery = useStudentWeeklyTimetable(weekStart);
  const classQuery = useClassWeeklyTimetable(classId ?? '', weekStart);

  const isTeacher = !!role.isTeacher && !classId;
  const isStudent = !!role.isStudent && !classId;
  const isAdminClass = !!role.isAdmin && !!classId;
  const isAdminNoClass = !!role.isAdmin && !classId;

  // Server returns 409 with { success: false, error: 'NotEnrolled' } for students
  // whose account has no class enrollment for the active academic year.
  // apiGet throws ApiException with .status and .data carrying the response body.
  const studentNotEnrolled =
    isStudent &&
    ((studentQuery.error as any)?.status === 409 ||
      (studentQuery.error as any)?.data?.error === 'NotEnrolled' ||
      (studentQuery.error as any)?.data?.error?.code === 'NotEnrolled');

  const data = isTeacher
    ? teacherQuery.data
    : isStudent
    ? studentQuery.data
    : isAdminClass
    ? classQuery.data
    : undefined;

  const isLoading = isTeacher
    ? teacherQuery.isLoading
    : isStudent
    ? studentQuery.isLoading
    : isAdminClass
    ? classQuery.isLoading
    : false;

  const secondaryField: 'class' | 'teacher' | 'room' = isTeacher
    ? 'class'
    : isStudent
    ? 'teacher'
    : 'teacher';

  return (
    <View style={{ flex: 1, padding: spacing.marginMobile, gap: spacing.lg }}>
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={[typography.display, { color: palette.onSurface }]}>
            {t('title', { defaultValue: 'Timetable' })}
          </Text>
          <Link onPress={() => setWeekStart(isoMondayOf(new Date()))}>
            {t('today', { defaultValue: 'Today →' })}
          </Link>
        </View>
        <Text
          style={[
            typography.bodyMd,
            { color: palette.onSurfaceVariant, marginTop: spacing.xs },
          ]}
        >
          {isAdminClass
            ? t('classView', { defaultValue: 'Class view' })
            : t('yourSchedule', { defaultValue: 'Your weekly schedule' })}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Pressable onPress={() => setWeekStart(shiftWeek(weekStart, -1))} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={palette.onSurfaceVariant} />
        </Pressable>
        <Text
          style={[
            typography.labelMd,
            { color: palette.onSurface, fontFamily: 'Inter_600SemiBold' },
          ]}
        >
          {data
            ? t('weekOf', {
                defaultValue: 'Week of {{range}}',
                range: formatWeekRange(data.week_start_date, data.week_end_date),
              })
            : t('loading', { defaultValue: 'Loading…' })}
        </Text>
        <Pressable onPress={() => setWeekStart(shiftWeek(weekStart, 1))} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={palette.onSurfaceVariant} />
        </Pressable>
      </View>

      {isAdminNoClass ? (
        <View
          style={[
            elevation.card,
            { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
          ]}
        >
          <EmptyState
            icon={<Ionicons name="school-outline" size={36} color={palette.onSurfaceVariant} />}
            title={t('selectClass', { defaultValue: 'Select a class' })}
            description={t('selectClassHelp', {
              defaultValue: 'Open a class from the Classes screen and tap "View timetable".',
            })}
            action={{
              label: t('goToClasses', { defaultValue: 'Go to classes' }),
              onPress: () => router.push('/(protected)/classes'),
            }}
          />
        </View>
      ) : studentNotEnrolled ? (
        <View
          style={[
            elevation.card,
            { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
          ]}
        >
          <EmptyState
            icon={<Ionicons name="information-circle-outline" size={36} color={palette.onSurfaceVariant} />}
            title={t('notEnrolled', { defaultValue: 'Not enrolled yet' })}
            description={t('notEnrolledHelp', {
              defaultValue:
                "You haven't been assigned to a class for this academic year. Please contact your school office.",
            })}
          />
        </View>
      ) : isLoading && !data ? (
        <Skeleton width="100%" height={300} radius={radius.xl} />
      ) : !data || data.days.every((d) => d.periods.length === 0) ? (
        <View
          style={[
            elevation.card,
            { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl },
          ]}
        >
          <EmptyState
            icon={<Ionicons name="calendar-clear-outline" size={36} color={palette.onSurfaceVariant} />}
            title={t('noTimetable', { defaultValue: 'No timetable available yet' })}
            description={t('noTimetableHelp', {
              defaultValue: 'Your school is still finalising the timetable for this academic year.',
            })}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WeeklyGrid data={data} secondaryField={secondaryField} />
        </View>
      )}
    </View>
  );
}
