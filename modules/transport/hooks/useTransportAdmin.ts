import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { transportAdminService } from "../services/transportAdminService";

const STALE = 60_000;

/**
 * Query keys for the transport-admin surface. Academic-year-scoped keys carry
 * the active year as their last segment so switching the year refetches, and
 * mutations invalidate the whole `all` prefix.
 */
export const transportAdminKeys = {
  all: ["transport", "admin"] as const,
  dashboard: (ay: string) => ["transport", "admin", "dashboard", ay] as const,
  buses: (ay: string) => ["transport", "admin", "buses", ay] as const,
  busDetails: (id: string, ay: string) =>
    ["transport", "admin", "busDetails", id, ay] as const,
  drivers: () => ["transport", "admin", "drivers"] as const,
  driver: (id: string) => ["transport", "admin", "driver", id] as const,
  routes: () => ["transport", "admin", "routes"] as const,
  route: (id: string) => ["transport", "admin", "route", id] as const,
  routeStops: (id: string) => ["transport", "admin", "routeStops", id] as const,
  enrollments: (ay: string) => ["transport", "admin", "enrollments", ay] as const,
  exceptions: (ay: string, date: string) =>
    ["transport", "admin", "exceptions", ay, date] as const,
  feePlans: (ay: string) => ["transport", "admin", "feePlans", ay] as const,
};

export function useTransportDashboard(enabled = true) {
  const { selectedAcademicYearId } = useAcademicYearContext();
  return useQuery({
    queryKey: transportAdminKeys.dashboard(selectedAcademicYearId),
    queryFn: () => transportAdminService.getDashboard(selectedAcademicYearId || undefined),
    enabled,
    staleTime: STALE,
  });
}

export function useTransportBuses(enabled = true) {
  const { selectedAcademicYearId } = useAcademicYearContext();
  return useQuery({
    queryKey: transportAdminKeys.buses(selectedAcademicYearId),
    queryFn: () => transportAdminService.listBuses(selectedAcademicYearId || undefined),
    enabled,
    staleTime: STALE,
  });
}

export function useTransportBusDetails(busId: string | undefined, enabled = true) {
  const { selectedAcademicYearId } = useAcademicYearContext();
  return useQuery({
    queryKey: transportAdminKeys.busDetails(busId ?? "", selectedAcademicYearId),
    queryFn: () =>
      transportAdminService.getBusDetails(busId!, {
        academicYearId: selectedAcademicYearId || undefined,
      }),
    enabled: !!busId && enabled,
    staleTime: STALE,
  });
}

export function useTransportDrivers(enabled = true) {
  return useQuery({
    queryKey: transportAdminKeys.drivers(),
    queryFn: () => transportAdminService.listDrivers(),
    enabled,
    staleTime: STALE,
  });
}

export function useTransportDriver(driverId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: transportAdminKeys.driver(driverId ?? ""),
    queryFn: () => transportAdminService.getDriver(driverId!),
    enabled: !!driverId && enabled,
    staleTime: STALE,
  });
}

export function useTransportRoutes(enabled = true) {
  return useQuery({
    queryKey: transportAdminKeys.routes(),
    queryFn: () => transportAdminService.listRoutes(),
    enabled,
    staleTime: STALE,
  });
}

export function useTransportRoute(routeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: transportAdminKeys.route(routeId ?? ""),
    queryFn: () => transportAdminService.getRoute(routeId!),
    enabled: !!routeId && enabled,
    staleTime: STALE,
  });
}

export function useTransportRouteStops(routeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: transportAdminKeys.routeStops(routeId ?? ""),
    queryFn: () => transportAdminService.listRouteStops(routeId!),
    enabled: !!routeId && enabled,
    staleTime: STALE,
  });
}

export function useTransportEnrollments(enabled = true) {
  const { selectedAcademicYearId } = useAcademicYearContext();
  return useQuery({
    queryKey: transportAdminKeys.enrollments(selectedAcademicYearId),
    queryFn: () =>
      transportAdminService.listEnrollments(selectedAcademicYearId || undefined),
    enabled,
    staleTime: STALE,
  });
}

export function useTransportExceptions(exceptionDate?: string, enabled = true) {
  const { selectedAcademicYearId } = useAcademicYearContext();
  return useQuery({
    queryKey: transportAdminKeys.exceptions(selectedAcademicYearId, exceptionDate ?? ""),
    queryFn: () =>
      transportAdminService.listScheduleExceptions({
        academicYearId: selectedAcademicYearId,
        exceptionDate,
      }),
    // The exceptions endpoint requires an academic year.
    enabled: !!selectedAcademicYearId && enabled,
    staleTime: STALE,
  });
}

export function useTransportFeePlans(enabled = true) {
  const { selectedAcademicYearId } = useAcademicYearContext();
  return useQuery({
    queryKey: transportAdminKeys.feePlans(selectedAcademicYearId),
    queryFn: () => transportAdminService.listFeePlans(selectedAcademicYearId || undefined),
    enabled,
    staleTime: STALE,
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof transportAdminService.enroll>[0]) =>
      transportAdminService.enroll(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: transportAdminKeys.all }),
  });
}

export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportAdminService.unenroll(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: transportAdminKeys.all }),
  });
}

export function useCreateScheduleException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Parameters<typeof transportAdminService.createScheduleException>[0]
    ) => transportAdminService.createScheduleException(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: transportAdminKeys.all }),
  });
}

export function useDeleteScheduleException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportAdminService.deleteScheduleException(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: transportAdminKeys.all }),
  });
}
