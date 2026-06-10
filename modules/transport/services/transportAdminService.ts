import { apiGet, apiPost, apiPut, apiDelete } from "@/common/services/api";
import type {
  TransportBus,
  TransportBusDetailsResponse,
  TransportDriver,
  TransportRoute,
  TransportStop,
  TransportGlobalStop,
  TransportEnrollment,
  TransportDashboard,
  TransportScheduleExceptionRow,
  TransportScheduleExceptionType,
  TransportFeePlan,
  TransportFeeCycle,
} from "../adminTypes";

function qs(params: Record<string, string | undefined | null>): string {
  const e = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") e.set(k, v);
  }
  const s = e.toString();
  return s ? `?${s}` : "";
}

/**
 * Read + light-CRUD transport service for the admin mobile surface. Endpoints
 * mirror `/api/transport/*`. Structural authoring is intentionally excluded.
 */
export const transportAdminService = {
  getDashboard: (academicYearId?: string) =>
    apiGet<TransportDashboard>(
      `/api/transport/dashboard${qs({ academic_year_id: academicYearId })}`
    ),

  listBuses: (academicYearId?: string) =>
    apiGet<TransportBus[]>(
      `/api/transport/buses${qs({ academic_year_id: academicYearId })}`
    ),
  getBus: (id: string) => apiGet<TransportBus>(`/api/transport/buses/${id}`),
  getBusDetails: (busId: string, params?: { academicYearId?: string; date?: string }) =>
    apiGet<TransportBusDetailsResponse>(
      `/api/transport/buses/${busId}/details${qs({
        academic_year_id: params?.academicYearId,
        date: params?.date,
      })}`
    ),

  listDrivers: () => apiGet<TransportDriver[]>("/api/transport/drivers"),
  getDriver: (id: string) => apiGet<TransportDriver>(`/api/transport/drivers/${id}`),

  listRoutes: () => apiGet<TransportRoute[]>("/api/transport/routes"),
  getRoute: (id: string, includeStops = true) =>
    apiGet<TransportRoute>(
      `/api/transport/routes/${id}${qs({ include_stops: includeStops ? "true" : "false" })}`
    ),
  listRouteStops: (routeId: string, includeInactive = false) =>
    apiGet<TransportStop[]>(
      `/api/transport/routes/${routeId}/stops${qs({
        include_inactive: includeInactive ? "true" : undefined,
      })}`
    ),
  busesForRoute: (routeId: string, opts?: { onDate?: string; academicYearId?: string }) =>
    apiGet<TransportBus[]>(
      `/api/transport/routes/${routeId}/buses${qs({
        on_date: opts?.onDate,
        academic_year_id: opts?.academicYearId,
      })}`
    ),

  listGlobalStops: (opts?: { search?: string; area?: string }) =>
    apiGet<TransportGlobalStop[]>(
      `/api/transport/stops${qs({ search: opts?.search, area: opts?.area })}`
    ),

  listEnrollments: (academicYearId?: string) =>
    apiGet<TransportEnrollment[]>(
      `/api/transport/enrollments${qs({ academic_year_id: academicYearId })}`
    ),
  enroll: (body: {
    student_id: string;
    bus_id: string;
    route_id: string;
    academic_year_id?: string;
    pickup_point?: string;
    drop_point?: string;
    pickup_stop_id?: string;
    drop_stop_id?: string;
    monthly_fee: number;
    start_date: string;
    end_date?: string | null;
    fee_cycle?: TransportFeeCycle;
  }) => apiPost<TransportEnrollment>("/api/transport/enroll", body),
  updateEnrollment: (id: string, body: Record<string, unknown>) =>
    apiPut<TransportEnrollment>(`/api/transport/enroll/${id}`, body),
  unenroll: (id: string) => apiDelete(`/api/transport/enroll/${id}`),

  listScheduleExceptions: (params: {
    academicYearId: string;
    exceptionDate?: string;
    exceptionType?: TransportScheduleExceptionType;
  }) =>
    apiGet<TransportScheduleExceptionRow[]>(
      `/api/transport/schedules/exceptions${qs({
        academic_year_id: params.academicYearId,
        exception_date: params.exceptionDate,
        exception_type: params.exceptionType,
      })}`
    ),
  createScheduleException: (
    body:
      | {
          academic_year_id: string;
          exception_date: string;
          exception_type: "override";
          route_id: string;
          bus_id: string;
          driver_id: string;
          helper_id?: string | null;
          shift_type: "pickup" | "drop";
          start_time: string;
          end_time: string;
          reason?: string | null;
        }
      | {
          academic_year_id: string;
          exception_date: string;
          exception_type: "cancellation";
          schedule_id: string;
          reason?: string | null;
        }
  ) =>
    apiPost<TransportScheduleExceptionRow>("/api/transport/schedules/exceptions", body),
  deleteScheduleException: (id: string) =>
    apiDelete(`/api/transport/schedules/exceptions/${id}`),

  listFeePlans: (academicYearId?: string) =>
    apiGet<TransportFeePlan[]>(
      `/api/transport/fee-plans${qs({ academic_year_id: academicYearId })}`
    ),
};
