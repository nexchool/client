// client/modules/student-leaves/types.ts
export type LeaveType = 'sick' | 'medical' | 'family' | 'religious' | 'other';

export type LeaveStatus =
  | 'pending_class_teacher'
  | 'pending_admin'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type HalfDay = 'am' | 'pm' | null;

/**
 * Who applied, for somebody who has to decide.
 *
 * A principal has never met most of the children in a trust; a leave type and
 * a date range does not tell them which child this is. `guardian_*` arrives
 * only when the viewer may decide the request — a student reading their own
 * leave is not handed a contact block back.
 */
export interface LeaveApplicant {
  student_id: string;
  display_name: string | null;
  admission_number: string | null;
  roll_number: number | null;
  class_name: string | null;
  campus_name: string | null;
  medium_name: string | null;
  profile_picture: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
}

/** Why a row is sitting in a head's queue. */
export type QueueReason = 'awaiting_head' | 'teacher_away' | 'no_class_teacher';

export interface StudentLeave {
  id: string;
  tenant_id: string;
  student_id: string;
  student_name?: string | null;
  admission_number?: string | null;
  class_id: string;
  class_teacher_id: string | null;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  half_day: HalfDay;
  reason: string;
  attachment_document_id: string | null;
  status: LeaveStatus;
  requires_admin_approval: boolean;
  decided_by_id: string | null;
  decided_by_name: string | null;
  decided_at: string | null;
  /** The class teacher's approval, kept apart so the principal's does not
   *  overwrite it. Null until the first stage is cleared. */
  class_teacher_decided_by_name: string | null;
  class_teacher_decided_at: string | null;
  rejection_reason: string | null;
  cancel_requested_at: string | null;
  cancel_requested_reason: string | null;
  created_at: string;
  /** Only set on rows that came from a head's queue. */
  queue_reason?: QueueReason | null;
  /** Absent when the row carries no student context (the applicant's own list). */
  applicant?: LeaveApplicant;
}

export interface CreateStudentLeavePayload {
  student_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  half_day?: HalfDay | undefined;
  reason: string;
  attachment_document_id?: string | null;
}

/**
 * One page of leaves.
 *
 * `total` counts every leave the caller may see. For a student that is their
 * own handful; an admin holds `student.leave.read.all` and sees every leave
 * the school has recorded, which is why the list is paged at all.
 */
export interface StudentLeavePage {
  items: StudentLeave[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
