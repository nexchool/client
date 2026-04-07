/** Academic module + class hub (matches backend serializers). */

export interface ClassSubjectOffering {
  id: string;
  class_id: string;
  subject_id: string;
  subject_name: string | null;
  subject_code: string | null;
  weekly_periods: number;
  is_mandatory: boolean;
  is_elective_bucket: boolean;
  sort_order: number | null;
  academic_term_id: string | null;
  academic_term_name: string | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SubjectTeacherAssignment {
  id: string;
  class_subject_id: string;
  teacher_id: string;
  teacher_name: string | null;
  employee_id: string | null;
  role: "primary" | "assistant" | "guest" | string;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ClassTeacherAssignment {
  id: string;
  class_id: string;
  teacher_id: string;
  teacher_name: string | null;
  employee_id: string | null;
  role: "primary" | "assistant" | string;
  allow_attendance_marking: boolean;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TimetableVersion {
  id: string;
  class_id: string;
  bell_schedule_id: string | null;
  label: string | null;
  status: string;
  effective_from: string | null;
  effective_to: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TimetableEntryV2 {
  id: string;
  timetable_version_id: string;
  class_subject_id: string;
  subject_name: string | null;
  teacher_id: string;
  teacher_name: string | null;
  day_of_week: number;
  period_number: number;
  room: string | null;
  notes: string | null;
  entry_status: string;
  period_label?: string | null;
  period_name?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  editable?: boolean;
  conflict_flags?: string[];
  class_subject_teacher_id?: string | null;
}

export interface TimetableBellScheduleSummary {
  id: string;
  name: string;
  lesson_periods: BellSchedulePeriod[];
}

export interface TimetableBundle {
  timetable_version: TimetableVersion | null;
  items: TimetableEntryV2[];
  bell_schedule?: TimetableBellScheduleSummary | null;
  working_days?: number[];
  editable?: boolean;
}

export interface GenerateTimetableResult {
  timetable_version: TimetableVersion;
  entries_placed: number;
  total_required: number;
  unplaced_periods?: number;
  warnings: string[];
  conflicts?: string[];
}

export interface BellScheduleListItem {
  id: string;
  name: string;
  academic_year_id: string | null;
  day_of_week: number | null;
  is_default: boolean;
  valid_from: string | null;
  valid_to: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BellSchedulePeriod {
  id: string;
  bell_schedule_id: string;
  period_number: number;
  period_kind: string;
  starts_at: string | null;
  ends_at: string | null;
  label: string | null;
  sort_order: number | null;
}

export interface BellScheduleDetail extends BellScheduleListItem {
  periods: BellSchedulePeriod[];
}

export interface AcademicSettings {
  default_bell_schedule_id: string | null;
  [key: string]: unknown;
}

export interface AdminAcademicDashboard {
  success?: boolean;
  date: string;
  total_classes: number;
  lectures_today: number;
  pending_attendance_sessions: number;
  classes_without_timetable: number;
  class_subjects_without_primary_teacher: number;
  timetable_conflicts: Array<Record<string, unknown>>;
}

export interface AcademicHealthReport {
  classes_without_timetable: Array<{ id: string; name: string }>;
  timetable_conflicts: Array<Record<string, unknown>>;
  subjects_without_teachers?: unknown[];
  [key: string]: unknown;
}

export interface TeacherTodayScheduleResponse {
  date: string;
  lectures: Array<
    TimetableEntryV2 & {
      class_id: string;
      class_name: string;
      attendance_pending_today?: boolean;
    }
  >;
  next_lecture:
    | (TimetableEntryV2 & {
        class_id: string;
        class_name: string;
        attendance_pending_today?: boolean;
      })
    | null;
}

export interface StudentDashboardResponse {
  student_id: string;
  class_id: string | null;
  class_name: string | null;
  today_schedule: TimetableEntryV2[];
  weekly_timetable_preview: TimetableEntryV2[];
  attendance_summary: {
    total_days: number;
    present: number;
    percentage: number;
    source?: string;
  };
}

export interface AttendanceSessionV2 {
  id: string;
  class_id: string;
  class_name?: string | null;
  session_date: string | null;
  status: string;
  marked_by_user_id: string | null;
  assigned_marker_teacher_id: string | null;
  class_teacher_assignment_id: string | null;
  attendance_source: string | null;
  taken_by_role: string | null;
  notes: string | null;
  marked_at: string | null;
  finalized_at: string | null;
  finalized_by_user_id: string | null;
}

export interface AttendanceSessionRecordRow {
  student_id: string;
  student_name: string | null;
  admission_number: string | null;
  status: string;
  remarks: string | null;
}

export interface EligibleClassItem {
  class_id: string;
  class_name: string;
  reason: string;
  can_mark: boolean;
}
