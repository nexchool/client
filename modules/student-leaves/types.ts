// client/modules/student-leaves/types.ts
export type LeaveType = 'sick' | 'medical' | 'family' | 'religious' | 'other';

export type LeaveStatus =
  | 'pending_class_teacher'
  | 'pending_admin'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type HalfDay = 'am' | 'pm' | null;

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
  rejection_reason: string | null;
  cancel_requested_at: string | null;
  cancel_requested_reason: string | null;
  created_at: string;
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
