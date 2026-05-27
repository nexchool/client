import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { timetableService } from '../services/timetableService';
import type { WeeklyTimetable, WeeklyPeriod } from '../types';
import {
  useTimetableVersions,
  useTimetableBundle,
} from '@/modules/academics/hooks/useAcademicQueries';

const queryKeys = {
  teacherWeekly: (weekStart: string) => ['timetable', 'teacher-weekly', weekStart] as const,
  studentWeekly: (weekStart: string) => ['timetable', 'student-weekly', weekStart] as const,
};

export function useTeacherWeeklyTimetable(weekStartDate: string) {
  return useQuery({
    queryKey: queryKeys.teacherWeekly(weekStartDate),
    queryFn: () => timetableService.getTeacherWeekly({ weekStartDate }),
    staleTime: 60_000,
  });
}

export function useStudentWeeklyTimetable(weekStartDate: string) {
  return useQuery({
    queryKey: queryKeys.studentWeekly(weekStartDate),
    queryFn: () => timetableService.getStudentWeekly({ weekStartDate }),
    staleTime: 60_000,
  });
}

/**
 * Admin per-class — wraps existing per-class bundle and shapes into WeeklyTimetable.
 */
export function useClassWeeklyTimetable(classId: string, weekStartDate: string) {
  const versionsQuery = useTimetableVersions(classId, !!classId);
  const versionsData: any = versionsQuery.data;
  const activeVersionId: string | null =
    versionsData?.active_version_id ??
    versionsData?.versions?.find?.((v: any) => v.is_active)?.id ??
    versionsData?.[0]?.id ??
    null;
  const bundleQuery = useTimetableBundle(classId, activeVersionId, !!activeVersionId);

  const data: WeeklyTimetable | undefined = useMemo(() => {
    if (!bundleQuery.data) return undefined;
    return transformBundleToWeekly(bundleQuery.data, weekStartDate);
  }, [bundleQuery.data, weekStartDate]);

  return {
    data,
    isLoading: versionsQuery.isLoading || bundleQuery.isLoading,
    isRefetching: bundleQuery.isRefetching,
    refetch: bundleQuery.refetch,
  };
}

function transformBundleToWeekly(bundle: any, weekStartDate: string): WeeklyTimetable {
  // Two known shapes from the existing per-class endpoint:
  //   1. { periods: [{ day_of_week, ... }] }
  //   2. { entries: [{ day_of_week, ... }] }
  // day_of_week is 0=Mon..6=Sun (per server convention).
  // If the server response doesn't match either shape, render an empty grid
  // and surface the drift in dev so it can be reconciled.
  const periods: any[] =
    (Array.isArray(bundle?.periods) ? bundle.periods : undefined) ??
    (Array.isArray(bundle?.entries) ? bundle.entries : undefined) ??
    [];
  if (periods.length === 0 && bundle && Object.keys(bundle).length > 0) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[useTimetable] transformBundleToWeekly: unrecognized bundle shape',
        Object.keys(bundle),
      );
    }
  }
  const days: WeeklyPeriod[][] = Array.from({ length: 7 }, () => []);
  for (const p of periods) {
    const dow = Number(p.day_of_week);
    if (dow >= 0 && dow <= 6) {
      days[dow].push({
        id: String(p.id),
        start_time: String(p.start_time).slice(0, 5),
        end_time: String(p.end_time).slice(0, 5),
        subject: p.subject ?? null,
        class_section: p.class_section ?? null,
        teacher: p.teacher ?? null,
        room: p.room ?? null,
      });
    }
  }
  const start = new Date(weekStartDate);
  return {
    academic_year: bundle?.academic_year ?? { id: '', name: '' },
    week_start_date: weekStartDate,
    week_end_date: new Date(start.getTime() + 6 * 86400000).toISOString().slice(0, 10),
    days: days.map((periods, idx) => ({
      day_of_week: idx, // 0..6
      date: new Date(start.getTime() + idx * 86400000).toISOString().slice(0, 10),
      periods: periods.sort((a, b) => a.start_time.localeCompare(b.start_time)),
    })),
  };
}
