import { apiGet, apiPost, apiPatch } from "@/common/services/api";
import type {
  Hostel,
  HostelRoom,
  HostelAllocation,
  HostelGatepass,
  HostelVisitor,
  HostelVisitorLog,
  HostelDashboard,
  RoomDetailResponse,
  GatepassDetailResponse,
  AllocationFilters,
  GatepassFilters,
  VisitorLogFilters,
} from "../adminTypes";

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const e = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") e.set(k, String(v));
  }
  const s = e.toString();
  return s ? `?${s}` : "";
}

/**
 * Read + light-action hostel service for the admin mobile surface. Endpoints
 * mirror `/api/hostel/*`. Structural authoring (hostel/room/bed CRUD,
 * bed-by-bed allocation) is intentionally excluded — that stays web-only.
 */
export const hostelAdminService = {
  getDashboard: () => apiGet<HostelDashboard>("/api/hostel/dashboard"),

  // ---- Facility (read) ----
  listHostels: () => apiGet<{ hostels: Hostel[] }>("/api/hostel/hostels").then((r) => r.hostels),
  getHostel: (id: string) =>
    apiGet<{ hostel: Hostel }>(`/api/hostel/hostels/${id}`).then((r) => r.hostel),
  listRooms: (hostelId: string) =>
    apiGet<{ rooms: HostelRoom[] }>(`/api/hostel/hostels/${hostelId}/rooms`).then((r) => r.rooms),
  getRoom: (roomId: string) => apiGet<RoomDetailResponse>(`/api/hostel/rooms/${roomId}`),

  // ---- Residents / allocations (read) ----
  listAllocations: (filters?: AllocationFilters) =>
    apiGet<{ allocations: HostelAllocation[] }>(`/api/hostel/allocations${qs({ ...filters })}`).then(
      (r) => r.allocations
    ),
  getStudentAllocation: (studentId: string) =>
    apiGet<{ allocation: HostelAllocation }>(`/api/hostel/students/${studentId}/allocation`).then(
      (r) => r.allocation
    ),

  // ---- Gatepasses (read + warden/gatekeeper actions) ----
  listGatepasses: (filters?: GatepassFilters) =>
    apiGet<{ gatepasses: HostelGatepass[] }>(`/api/hostel/gatepasses${qs({ ...filters })}`).then(
      (r) => r.gatepasses
    ),
  getGatepass: (id: string) => apiGet<GatepassDetailResponse>(`/api/hostel/gatepasses/${id}`),
  listOverdueGatepasses: (hostelId?: string) =>
    apiGet<{ gatepasses: HostelGatepass[] }>(
      `/api/hostel/gatepasses/overdue${qs({ hostel_id: hostelId })}`
    ).then((r) => r.gatepasses),
  approveGatepass: (id: string) =>
    apiPost<{ gatepass: HostelGatepass }>(`/api/hostel/gatepasses/${id}/approve`, {}).then(
      (r) => r.gatepass
    ),
  rejectGatepass: (id: string, reason?: string) =>
    apiPost<{ gatepass: HostelGatepass }>(`/api/hostel/gatepasses/${id}/reject`, { reason }).then(
      (r) => r.gatepass
    ),
  gatepassCheckout: (id: string) =>
    apiPost<{ gatepass: HostelGatepass }>(`/api/hostel/gatepasses/${id}/checkout`, {}).then(
      (r) => r.gatepass
    ),
  gatepassCheckin: (id: string) =>
    apiPost<{ gatepass: HostelGatepass }>(`/api/hostel/gatepasses/${id}/checkin`, {}).then(
      (r) => r.gatepass
    ),

  // ---- Visitors (read + gate-desk check in/out) ----
  listVisitorLogs: (filters?: VisitorLogFilters) =>
    apiGet<{ visitor_logs: HostelVisitorLog[] }>(
      `/api/hostel/visitor-logs${qs({ ...filters })}`
    ).then((r) => r.visitor_logs),
  searchVisitors: (phonePrefix: string) =>
    apiGet<{ visitors: HostelVisitor[] }>(
      `/api/hostel/visitors/search${qs({ phone_prefix: phonePrefix })}`
    ).then((r) => r.visitors),
  visitorCheckIn: (body: {
    phone: string;
    name: string;
    relation_type?: string;
    student_id: string;
    hostel_id: string;
    room_id?: string;
    purpose?: string;
  }) => apiPost<{ visitor_log: HostelVisitorLog }>("/api/hostel/visitors", body).then((r) => r.visitor_log),
  visitorCheckOut: (logId: string) =>
    apiPatch<{ visitor_log: HostelVisitorLog }>(
      `/api/hostel/visitor-logs/${logId}/checkout`,
      {}
    ).then((r) => r.visitor_log),
};
