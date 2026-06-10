/**
 * Admin-side hostel types — mirror of the server contract
 * (admin-web/src/services/hostelService.ts) plus the `student_name` /
 * `admission_number` enrichment the backend now adds to gatepass, allocation
 * and visitor-log responses. Covers the read + light-action surface the mobile
 * hostel-admin module needs. Structural authoring (hostel/room/bed
 * create-edit-delete) and bed-by-bed allocation stay web-only.
 */

export type HostelStatus = "active" | "inactive" | "maintenance";
export type BedStatus = "active" | "maintenance" | "removed";
export type AllocationStatus = "active" | "completed" | "moved";
export type GatepassType = "day_out" | "night_out";
export type GatepassStatus =
  | "pending"
  | "approved"
  | "active"
  | "closed"
  | "rejected"
  | "overdue";

export interface Hostel {
  id: string;
  name: string;
  warden_name: string | null;
  warden_phone: string | null;
  address: string | null;
  capacity: number;
  status: HostelStatus;
}

export interface HostelRoom {
  id: string;
  hostel_id: string;
  room_number: string;
  /** e.g. "Ground Floor", "1st Floor" — used to group rooms. */
  floor: string;
  capacity: number;
  status: HostelStatus;
}

export interface HostelBed {
  id: string;
  room_id: string;
  bed_number: string;
  is_allocated: boolean;
  allocated_to_student_id: string | null;
  status: BedStatus;
  /** Enriched on /api/hostel/rooms/:id only; absence ≠ "vacant". */
  occupant?: {
    student_id: string;
    name: string;
    admission_number: string;
  } | null;
}

export interface HostelAllocation {
  id: string;
  student_id: string;
  hostel_id: string;
  room_id: string;
  bed_id: string;
  academic_year_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  status: AllocationStatus;
  notes: string | null;
  /** Server enrichment (may be null when the student can't be resolved). */
  student_name?: string | null;
  admission_number?: string | null;
}

export interface HostelGatepass {
  id: string;
  student_id: string;
  hostel_id: string;
  type: GatepassType;
  status: GatepassStatus;
  requested_at: string;
  approved_at: string | null;
  actual_out_at: string | null;
  actual_in_at: string | null;
  departure_datetime: string;
  expected_return_datetime: string;
  reason: string | null;
  notes: string | null;
  parent_phone: string;
  parent_consent_status: string;
  approved_by_user_id: string | null;
  /** Server enrichment. */
  student_name?: string | null;
  admission_number?: string | null;
}

export interface HostelGatepassAudit {
  id: string;
  gatepass_id: string;
  action: string;
  actor_type: string;
  actor_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface HostelVisitor {
  id: string;
  phone: string;
  name: string;
  relation_type: string | null;
}

export interface HostelVisitorLog {
  id: string;
  visitor_id: string;
  student_id: string;
  hostel_id: string;
  room_id: string | null;
  check_in_at: string;
  check_out_at: string | null;
  purpose: string | null;
  /** Server enrichment — the student being visited. */
  student_name?: string | null;
  admission_number?: string | null;
  /** Server enrichment — the visitor. */
  visitor_name?: string | null;
  visitor_phone?: string | null;
}

export interface OccupancyRow {
  hostel_id: string;
  hostel_name: string;
  status: HostelStatus;
  total_beds: number;
  active_allocations: number;
  vacant_beds: number;
  occupancy_pct: number;
}

export interface HostelDashboard {
  occupancy: OccupancyRow[];
  overdue_gatepasses: HostelGatepass[];
  visitors_inside: number;
}

export interface RoomDetailResponse {
  room: HostelRoom;
  beds: HostelBed[];
}

export interface GatepassDetailResponse {
  gatepass: HostelGatepass;
  audit_trail: HostelGatepassAudit[];
}

export interface AllocationFilters {
  hostel_id?: string;
  room_id?: string;
  student_id?: string;
  status?: AllocationStatus;
  academic_year_id?: string;
}

export interface GatepassFilters {
  hostel_id?: string;
  student_id?: string;
  status?: GatepassStatus;
  type?: GatepassType;
}

export interface VisitorLogFilters {
  hostel_id?: string;
  student_id?: string;
  open?: boolean;
  start_date?: string;
  end_date?: string;
}
