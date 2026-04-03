import { apiGet, apiPost } from "@/common/services/api";
import type {
  AttendanceSessionRecordRow,
  AttendanceSessionV2,
  EligibleClassItem,
} from "../types";

const enc = encodeURIComponent;

export const attendanceV2Api = {
  getEligibleClasses: (date?: string) => {
    let u = "/api/attendance/eligible-classes";
    if (date) u += `?date=${enc(date)}`;
    return apiGet<{ items: EligibleClassItem[]; date: string }>(u);
  },

  getClassSession: (classId: string, date: string) =>
    apiGet<{
      session: AttendanceSessionV2 | null;
      records: AttendanceSessionRecordRow[];
    }>(`/api/attendance/class/${enc(classId)}/session?date=${enc(date)}`),

  createClassSession: (
    classId: string,
    body: { session_date: string; assigned_marker_teacher_id?: string | null; notes?: string | null }
  ) =>
    apiPost<{ session: AttendanceSessionV2; created: boolean }>(
      `/api/attendance/class/${enc(classId)}/session`,
      body
    ),

  upsertSessionRecords: (
    sessionId: string,
    records: Array<{ student_id: string; status: string; remarks?: string | null }>
  ) =>
    apiPost<{ success: boolean; created?: number; updated?: number }>(
      `/api/attendance/sessions/${enc(sessionId)}/records`,
      { records }
    ),

  finalizeSession: (sessionId: string) =>
    apiPost<{ session: AttendanceSessionV2 }>(`/api/attendance/sessions/${enc(sessionId)}/finalize`),

  getClassHistory: (classId: string) =>
    apiGet<{ items: AttendanceSessionV2[] }>(`/api/attendance/class/${enc(classId)}/history`),

  getStudentAttendanceV2: (studentId: string, month?: string) => {
    let u = `/api/attendance/student/${enc(studentId)}/v2`;
    if (month) u += `?month=${enc(month)}`;
    return apiGet<{
      student_id: string;
      source: string;
      total_days: number;
      present: number;
      percentage: number;
      records: Array<{ date: string; status: string; remarks: string | null; session_id: string }>;
    }>(u);
  },

  getMyAttendanceV2: (month?: string) => {
    let u = "/api/attendance/me/v2";
    if (month) u += `?month=${enc(month)}`;
    return apiGet<{
      student_id: string;
      source: string;
      total_days: number;
      present: number;
      percentage: number;
      records: Array<{ date: string; status: string; remarks: string | null; session_id: string }>;
    }>(u);
  },
};
