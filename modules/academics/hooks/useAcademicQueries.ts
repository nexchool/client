import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classAcademicApi, academicsAdminApi, bellScheduleApi, academicSettingsApi } from "../api/classAcademicApi";
import { attendanceV2Api } from "../api/attendanceV2Api";
import { qk } from "./queryKeys";
import { studentService } from "@/modules/students/services/studentService";
import { teacherService } from "@/modules/teachers/services/teacherService";
import type { AdminAcademicDashboard, AcademicHealthReport } from "../types";

export function useClassSubjects(classId: string, enabled = true) {
  return useQuery({
    queryKey: qk.classSubjects(classId),
    queryFn: async () => (await classAcademicApi.listClassSubjects(classId)).items,
    enabled: !!classId && enabled,
  });
}

export function useSubjectTeachers(classId: string, enabled = true) {
  return useQuery({
    queryKey: qk.subjectTeachers(classId),
    queryFn: async () => (await classAcademicApi.listSubjectTeachers(classId)).items,
    enabled: !!classId && enabled,
  });
}

export function useClassTeachers(classId: string, enabled = true) {
  return useQuery({
    queryKey: qk.classTeachers(classId),
    queryFn: async () => (await classAcademicApi.listClassTeachers(classId)).items,
    enabled: !!classId && enabled,
  });
}

export function useTimetableVersions(classId: string, enabled = true) {
  return useQuery({
    queryKey: qk.timetableVersions(classId),
    queryFn: async () => (await classAcademicApi.listTimetableVersions(classId)).items,
    enabled: !!classId && enabled,
  });
}

export function useTimetableBundle(classId: string, versionId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.timetableBundle(classId, versionId),
    queryFn: () => classAcademicApi.getTimetable(classId, versionId ?? undefined),
    enabled: !!classId && enabled,
  });
}

export function useBellSchedulesList(enabled = true) {
  return useQuery({
    queryKey: qk.bellSchedules(),
    queryFn: async () => (await bellScheduleApi.list()).items,
    enabled,
  });
}

export function useBellScheduleDetail(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.bellSchedule(id ?? ""),
    queryFn: () => bellScheduleApi.get(id!),
    enabled: !!id && enabled,
  });
}

export function useAcademicSettings(enabled = true) {
  return useQuery({
    queryKey: qk.academicSettings(),
    queryFn: () => academicSettingsApi.get(),
    enabled,
  });
}

export function useAdminAcademicDashboard(enabled = true) {
  return useQuery({
    queryKey: qk.adminDashboard(),
    queryFn: async () => {
      const r = await academicsAdminApi.getDashboard();
      return r as unknown as AdminAcademicDashboard;
    },
    enabled,
  });
}

export function useAcademicHealth(enabled = true) {
  return useQuery({
    queryKey: qk.academicHealth(),
    queryFn: () => academicsAdminApi.getHealth() as Promise<AcademicHealthReport>,
    enabled,
  });
}

export function useTeacherTodaySchedule(enabled = true) {
  return useQuery({
    queryKey: qk.teacherToday(),
    queryFn: () => teacherService.getTodaySchedule(),
    enabled,
  });
}

export function useStudentAcademicDashboard(enabled = true) {
  return useQuery({
    queryKey: qk.studentDashboard(),
    queryFn: () => studentService.getMyDashboard(),
    enabled,
  });
}

export function useEligibleAttendanceClasses(date: string, enabled = true) {
  return useQuery({
    queryKey: qk.eligibleClasses(date),
    queryFn: async () => (await attendanceV2Api.getEligibleClasses(date)).items,
    enabled,
  });
}

export function useClassAttendanceSession(classId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: qk.classSession(classId, date),
    queryFn: () => attendanceV2Api.getClassSession(classId, date),
    enabled: !!classId && !!date && enabled,
  });
}

export function useClassAttendanceHistory(classId: string, enabled = true) {
  return useQuery({
    queryKey: qk.classAttendanceHistory(classId),
    queryFn: async () => (await attendanceV2Api.getClassHistory(classId)).items,
    enabled: !!classId && enabled,
  });
}

export function useMyAttendanceV2(month: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.myAttendanceV2(month),
    queryFn: () => attendanceV2Api.getMyAttendanceV2(month),
    enabled,
  });
}

/** Invalidate all class-hub queries after mutations */
export function useInvalidateClassAcademics(classId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.classSubjects(classId) });
    qc.invalidateQueries({ queryKey: qk.subjectTeachers(classId) });
    qc.invalidateQueries({ queryKey: qk.classTeachers(classId) });
    qc.invalidateQueries({ queryKey: qk.timetableVersions(classId) });
    qc.invalidateQueries({ queryKey: ["academics", "timetable", classId] });
  };
}
