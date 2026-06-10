/**
 * Admin-side transport types — mirror of the server contract
 * (admin-web/src/services/transportService.ts). Covers the read + light-CRUD
 * surface the mobile transport-admin module needs. Structural authoring
 * (bus/route/stop create-edit-delete, stop reorder, bus assignments) stays
 * web-only, so those shapes are intentionally omitted here.
 */

export type TransportFeeCycle = "monthly" | "quarterly" | "half_yearly" | "yearly";

export interface TransportBusOperational {
  code: "ok" | "no_active_route" | "no_active_schedules";
  message: string | null;
  derived_state?: string | null;
}

export interface TransportBus {
  id: string;
  bus_number: string;
  vehicle_number?: string | null;
  capacity: number;
  status: string;
  occupancy_count?: number;
  occupancy_percent?: number;
  occupancy_health?: string;
  assigned_driver?: Record<string, unknown> | null;
  assigned_helper?: Record<string, unknown> | null;
  assigned_route?: { id: string; name: string } | null;
  transport_operational?: TransportBusOperational;
}

export interface TransportDriver {
  id: string;
  name: string;
  phone?: string | null;
  alternate_phone?: string | null;
  license_number?: string | null;
  address?: string | null;
  status: string;
}

export interface TransportStaff extends TransportDriver {
  role?: string;
}

export interface TransportStop {
  id: string;
  route_id?: string | null;
  name: string;
  sequence_order: number;
  pickup_time?: string | null;
  drop_time?: string | null;
  is_active: boolean;
  area?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  route_stop_id?: string;
}

export interface TransportGlobalStop extends TransportStop {
  usage_count?: number;
  used_in_routes?: { id: string; name: string; sequence_order: number }[];
}

export interface TransportRoute {
  id: string;
  name: string;
  start_point?: string | null;
  end_point?: string | null;
  pickup_time?: string | null;
  drop_time?: string | null;
  status?: string;
  stops?: TransportStop[];
  default_fee?: number | null;
  fee_cycle?: TransportFeeCycle | null;
  is_reverse_enabled?: boolean;
  stops_count?: number;
  schedules_count?: number;
}

export type TransportEnrollmentDerivedStatus =
  | "active"
  | "route_inactive"
  | "schedule_missing";

export interface EnrollmentTransportHints {
  junction_pickup_time?: string | null;
  junction_drop_time?: string | null;
  schedule_pickup_windows: Array<{ start_time: string; end_time: string }>;
  pickup_time_display?: string | null;
}

export interface TransportEnrollment {
  id: string;
  student_id: string;
  bus_id: string;
  route_id: string;
  academic_year_id?: string | null;
  pickup_point?: string | null;
  drop_point?: string | null;
  pickup_stop_id?: string | null;
  drop_stop_id?: string | null;
  pickup_stop?: TransportStop | null;
  drop_stop?: TransportStop | null;
  monthly_fee: number;
  fee_cycle?: TransportFeeCycle | null;
  status: string;
  start_date: string;
  end_date?: string | null;
  student_name?: string;
  admission_number?: string;
  bus?: TransportBus;
  route?: TransportRoute;
  transport_hints?: EnrollmentTransportHints;
  transport_status?: TransportEnrollmentDerivedStatus | null;
}

export interface TransportDashboard {
  academic_year_id?: string | null;
  total_buses: number;
  active_buses: number;
  total_students_on_transport: number;
  buses_near_capacity_count: number;
  occupancy_per_bus: {
    bus_id: string;
    bus_number: string;
    status?: string;
    capacity: number;
    occupancy: number;
    occupancy_percent: number;
    occupancy_health?: string;
  }[];
  route_distribution: { route_id: string; route_name: string; students: number }[];
  students_on_inactive_routes?: number;
  buses_without_active_routes?: number;
  drivers_without_schedules?: number;
}

export interface TransportScheduleTimelineBlock {
  schedule_id: string | null;
  exception_id?: string | null;
  route: { id: string; name: string } | null;
  bus?: { id: string; bus_number: string } | null;
  driver?: { id: string; name: string } | null;
  shift_type: string;
  start_time: string;
  end_time: string;
  is_exception?: boolean;
}

export interface TransportBusDetailsResponse {
  bus: TransportBus;
  driver: TransportDriver | null;
  helper: TransportStaff | null;
  route: TransportRoute | null;
  capacity: number;
  occupancy: number;
  occupancy_percent: number;
  occupancy_health: string;
  students: {
    enrollment_id: string;
    student_id: string;
    student_name: string | null;
    admission_number: string | null;
    pickup_point?: string | null;
    drop_point?: string | null;
  }[];
  schedule_timeline: TransportScheduleTimelineBlock[];
  timeline_date?: string | null;
  is_timeline_holiday?: boolean;
  transport_operational?: TransportBusOperational;
}

export type TransportScheduleExceptionType = "override" | "cancellation";

export interface TransportScheduleExceptionRow {
  id: string;
  academic_year_id: string;
  exception_date: string;
  exception_type: TransportScheduleExceptionType;
  route: { id: string; name: string } | null;
  bus: { id: string; bus_number: string } | null;
  driver: { id: string; name: string } | null;
  helper: { id: string; name: string } | null;
  shift_type: string | null;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  schedule_id: string | null;
  created_at?: string | null;
}

export interface TransportFeePlan {
  id: string;
  route_id: string;
  amount: number;
  academic_year_id?: string;
}
