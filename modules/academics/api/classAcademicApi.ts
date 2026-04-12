import { apiDelete, apiGet, apiPatch, apiPost } from "@/common/services/api";
import type {
  BellScheduleDetail,
  BellScheduleListItem,
  BellSchedulePeriod,
  ClassSubjectOffering,
  ClassTeacherAssignment,
  GenerateTimetableResult,
  SubjectTeacherAssignment,
  TimetableBundle,
  TimetableEntryV2,
  TimetableVersion,
} from "../types";

const enc = encodeURIComponent;

export const classAcademicApi = {
  listClassSubjects: (classId: string) =>
    apiGet<{ items: ClassSubjectOffering[] }>(`/api/classes/${enc(classId)}/subjects`),

  createClassSubject: (
    classId: string,
    body: {
      subject_id: string;
      weekly_periods: number;
      is_mandatory?: boolean;
      academic_term_id?: string | null;
      status?: string;
    }
  ) => apiPost<ClassSubjectOffering>(`/api/classes/${enc(classId)}/subjects`, body),

  patchClassSubject: (
    classId: string,
    csId: string,
    body: Partial<{
      weekly_periods: number;
      is_mandatory: boolean;
      academic_term_id: string | null;
      status: string;
      sort_order: number | null;
    }>
  ) => apiPatch<ClassSubjectOffering>(`/api/classes/${enc(classId)}/subjects/${enc(csId)}`, body),

  deleteClassSubject: (classId: string, csId: string) =>
    apiDelete<{ message?: string }>(`/api/classes/${enc(classId)}/subjects/${enc(csId)}`),

  listSubjectTeachers: (classId: string) =>
    apiGet<{ items: SubjectTeacherAssignment[] }>(`/api/classes/${enc(classId)}/subject-teachers`),

  createSubjectTeacher: (
    classId: string,
    body: {
      class_subject_id: string;
      teacher_id: string;
      role?: string;
      effective_from?: string | null;
      effective_to?: string | null;
      is_active?: boolean;
    }
  ) =>
    apiPost<SubjectTeacherAssignment>(`/api/classes/${enc(classId)}/subject-teachers`, body),

  patchSubjectTeacher: (
    classId: string,
    aid: string,
    body: Partial<{
      teacher_id: string;
      role: string;
      effective_from: string | null;
      effective_to: string | null;
      is_active: boolean;
    }>
  ) =>
    apiPatch<SubjectTeacherAssignment>(
      `/api/classes/${enc(classId)}/subject-teachers/${enc(aid)}`,
      body
    ),

  deleteSubjectTeacher: (classId: string, aid: string) =>
    apiDelete<{ message?: string }>(`/api/classes/${enc(classId)}/subject-teachers/${enc(aid)}`),

  listClassTeachers: (classId: string) =>
    apiGet<{ items: ClassTeacherAssignment[] }>(`/api/classes/${enc(classId)}/class-teachers`),

  createClassTeacher: (
    classId: string,
    body: {
      teacher_id: string;
      role?: string;
      allow_attendance_marking?: boolean;
      effective_from?: string | null;
      effective_to?: string | null;
      is_active?: boolean;
    }
  ) => apiPost<ClassTeacherAssignment>(`/api/classes/${enc(classId)}/class-teachers`, body),

  patchClassTeacher: (
    classId: string,
    aid: string,
    body: Partial<{
      teacher_id: string;
      role: string;
      allow_attendance_marking: boolean;
      effective_from: string | null;
      effective_to: string | null;
      is_active: boolean;
    }>
  ) =>
    apiPatch<ClassTeacherAssignment>(`/api/classes/${enc(classId)}/class-teachers/${enc(aid)}`, body),

  deleteClassTeacher: (classId: string, aid: string) =>
    apiDelete<{ message?: string }>(`/api/classes/${enc(classId)}/class-teachers/${enc(aid)}`),

  listTimetableVersions: (classId: string) =>
    apiGet<{ items: TimetableVersion[] }>(`/api/classes/${enc(classId)}/timetable/versions`),

  createTimetableVersion: (
    classId: string,
    body: Partial<{
      bell_schedule_id: string | null;
      label: string | null;
      status: string;
      effective_from: string | null;
      effective_to: string | null;
    }>
  ) => apiPost<TimetableVersion>(`/api/classes/${enc(classId)}/timetable/versions`, body),

  patchTimetableVersion: (
    classId: string,
    vid: string,
    body: Partial<{
      bell_schedule_id: string | null;
      label: string | null;
      status: string;
      effective_from: string | null;
      effective_to: string | null;
    }>
  ) =>
    apiPatch<TimetableVersion>(`/api/classes/${enc(classId)}/timetable/versions/${enc(vid)}`, body),

  activateTimetableVersion: (classId: string, vid: string) =>
    apiPost<TimetableVersion>(`/api/classes/${enc(classId)}/timetable/versions/${enc(vid)}/activate`),

  cloneTimetableVersion: (classId: string, body?: { label?: string | null }) =>
    apiPost<TimetableVersion>(`/api/classes/${enc(classId)}/timetable/versions/clone`, body ?? {}),

  deleteTimetableVersion: (classId: string, vid: string) =>
    apiDelete<{ message?: string }>(`/api/classes/${enc(classId)}/timetable/versions/${enc(vid)}`),

  getTimetable: (classId: string, versionId?: string | null) => {
    let q = `/api/classes/${enc(classId)}/timetable`;
    if (versionId) q += `?version_id=${enc(versionId)}`;
    return apiGet<TimetableBundle>(q);
  },

  createTimetableEntry: (
    classId: string,
    body: {
      timetable_version_id: string;
      class_subject_id: string;
      teacher_id: string;
      day_of_week: number;
      period_number: number;
      room?: string | null;
      notes?: string | null;
      entry_status?: string;
    }
  ) => apiPost<TimetableEntryV2>(`/api/classes/${enc(classId)}/timetable/entries`, body),

  patchTimetableEntry: (
    classId: string,
    eid: string,
    body: Partial<{
      class_subject_id: string;
      teacher_id: string;
      day_of_week: number;
      period_number: number;
      room: string | null;
      notes: string | null;
      entry_status: string;
    }>
  ) => apiPatch<TimetableEntryV2>(`/api/classes/${enc(classId)}/timetable/entries/${enc(eid)}`, body),

  deleteTimetableEntry: (classId: string, eid: string) =>
    apiDelete<{ message?: string }>(`/api/classes/${enc(classId)}/timetable/entries/${enc(eid)}`),

  moveTimetableEntry: (
    classId: string,
    eid: string,
    body: { day_of_week: number; period_number: number }
  ) =>
    apiPost<TimetableEntryV2>(`/api/classes/${enc(classId)}/timetable/entries/${enc(eid)}/move`, body),

  swapTimetableEntries: (
    classId: string,
    body: { entry_a_id: string; entry_b_id: string }
  ) =>
    apiPost<{ entry_a: TimetableEntryV2; entry_b: TimetableEntryV2 }>(
      `/api/classes/${enc(classId)}/timetable/entries/swap`,
      body
    ),

  generateTimetableDraft: (
    classId: string,
    body?: {
      timetable_version_id?: string;
      label?: string | null;
      bell_schedule_id?: string | null;
    }
  ) => apiPost<GenerateTimetableResult>(`/api/classes/${enc(classId)}/timetable/generate`, body ?? {}),
};

export const academicsAdminApi = {
  getDashboard: () => apiGet<Record<string, unknown>>("/api/academics/dashboard"),
  getHealth: () => apiGet<Record<string, unknown>>("/api/academics/health"),
};

export const bellScheduleApi = {
  list: () =>
    apiGet<{
      items: BellScheduleListItem[];
      /** School-wide default from academic settings (not the same as row `is_default`). */
      tenant_default_bell_schedule_id?: string | null;
    }>("/api/academics/bell-schedules"),
  get: (id: string) => apiGet<BellScheduleDetail>(`/api/academics/bell-schedules/${enc(id)}`),
  create: (body: Partial<{ name: string; academic_year_id: string | null; is_default: boolean }>) =>
    apiPost<BellScheduleListItem>("/api/academics/bell-schedules", body),
  patch: (id: string, body: Partial<Record<string, unknown>>) =>
    apiPatch<BellScheduleListItem>(`/api/academics/bell-schedules/${enc(id)}`, body),
  delete: (id: string) => apiDelete<{ message?: string }>(`/api/academics/bell-schedules/${enc(id)}`),
  listPeriods: (id: string) =>
    apiGet<{ items: BellSchedulePeriod[] }>(`/api/academics/bell-schedules/${enc(id)}/periods`),
  createPeriod: (id: string, body: Record<string, unknown>) =>
    apiPost<BellSchedulePeriod>(`/api/academics/bell-schedules/${enc(id)}/periods`, body),
  patchPeriod: (sid: string, pid: string, body: Record<string, unknown>) =>
    apiPatch<BellSchedulePeriod>(
      `/api/academics/bell-schedules/${enc(sid)}/periods/${enc(pid)}`,
      body
    ),
  deletePeriod: (sid: string, pid: string) =>
    apiDelete<{ message?: string }>(
      `/api/academics/bell-schedules/${enc(sid)}/periods/${enc(pid)}`
    ),
};

export const academicSettingsApi = {
  get: () => apiGet<Record<string, unknown>>("/api/academics/settings"),
  patch: (body: Record<string, unknown>) =>
    apiPatch<Record<string, unknown>>("/api/academics/settings", body),
};
