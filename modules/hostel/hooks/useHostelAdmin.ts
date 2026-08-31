import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { hostelAdminService } from "../services/hostelAdminService";
import type {
  AllocationFilters,
  AllocationPage,
  GatepassFilters,
  GatepassPage,
  VisitorLogFilters,
  VisitorLogPage,
} from "../adminTypes";

const STALE = 30_000;

/**
 * Query keys for the hostel-admin surface. Hostel data is not academic-year
 * scoped, so keys are plain; mutations invalidate the whole `all` prefix.
 * Tenant isolation is handled by the auth layer clearing the query cache on
 * login/logout (a session is bound to a single tenant on mobile).
 */
export const hostelAdminKeys = {
  all: ["hostel", "admin"] as const,
  dashboard: () => ["hostel", "admin", "dashboard"] as const,
  hostels: () => ["hostel", "admin", "hostels"] as const,
  hostel: (id: string) => ["hostel", "admin", "hostel", id] as const,
  rooms: (hostelId: string) => ["hostel", "admin", "rooms", hostelId] as const,
  room: (id: string) => ["hostel", "admin", "room", id] as const,
  allocations: (filters?: AllocationFilters) =>
    ["hostel", "admin", "allocations", filters ?? {}] as const,
  gatepasses: (filters?: GatepassFilters) =>
    ["hostel", "admin", "gatepasses", filters ?? {}] as const,
  gatepass: (id: string) => ["hostel", "admin", "gatepass", id] as const,
  overdue: () => ["hostel", "admin", "overdue"] as const,
  visitorLogs: (filters?: VisitorLogFilters) =>
    ["hostel", "admin", "visitorLogs", filters ?? {}] as const,
};

export function useHostelDashboard(enabled = true) {
  return useQuery({
    queryKey: hostelAdminKeys.dashboard(),
    queryFn: () => hostelAdminService.getDashboard(),
    enabled,
    staleTime: STALE,
  });
}

export function useHostels(enabled = true) {
  return useQuery({
    queryKey: hostelAdminKeys.hostels(),
    queryFn: () => hostelAdminService.listHostels(),
    enabled,
    staleTime: STALE,
  });
}

export function useHostel(hostelId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: hostelAdminKeys.hostel(hostelId ?? ""),
    queryFn: () => hostelAdminService.getHostel(hostelId!),
    enabled: !!hostelId && enabled,
    staleTime: STALE,
  });
}

export function useHostelRooms(hostelId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: hostelAdminKeys.rooms(hostelId ?? ""),
    queryFn: () => hostelAdminService.listRooms(hostelId!),
    enabled: !!hostelId && enabled,
    staleTime: STALE,
  });
}

export function useHostelRoom(roomId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: hostelAdminKeys.room(roomId ?? ""),
    queryFn: () => hostelAdminService.getRoom(roomId!),
    enabled: !!roomId && enabled,
    staleTime: STALE,
  });
}

/**
 * Boarders, a page at a time.
 *
 * A trust's hostels hold thousands of children across years, so this walks the
 * server's pages rather than holding the whole list in memory on a phone.
 * Search is a filter on the query, not something applied to the loaded rows.
 */
export function useHostelAllocations(filters?: AllocationFilters, enabled = true) {
  return useInfiniteQuery<AllocationPage>({
    queryKey: hostelAdminKeys.allocations(filters),
    queryFn: ({ pageParam }) =>
      hostelAdminService.listAllocations({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled,
    staleTime: STALE,
  });
}

/**
 * Gatepasses, a page at a time.
 *
 * The list is unbounded on the server side of a busy hostel — "closed" holds
 * every gatepass the school has ever issued — so this walks pages rather than
 * holding the whole history in memory on a phone.
 */
export function useHostelGatepasses(filters?: GatepassFilters, enabled = true) {
  return useInfiniteQuery<GatepassPage>({
    queryKey: hostelAdminKeys.gatepasses(filters),
    queryFn: ({ pageParam }) =>
      hostelAdminService.listGatepasses({
        ...filters,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled,
    staleTime: STALE,
  });
}

export function useHostelGatepass(gatepassId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: hostelAdminKeys.gatepass(gatepassId ?? ""),
    queryFn: () => hostelAdminService.getGatepass(gatepassId!),
    enabled: !!gatepassId && enabled,
    staleTime: STALE,
  });
}

export function useOverdueGatepasses(enabled = true) {
  return useQuery({
    queryKey: hostelAdminKeys.overdue(),
    queryFn: () => hostelAdminService.listOverdueGatepasses(),
    enabled,
    staleTime: STALE,
  });
}

/**
 * Visitor logs, a page at a time.
 *
 * The `open: true` view is bounded by who is in the building and comes back
 * whole in one page; the history grows for the life of the school.
 */
export function useHostelVisitorLogs(filters?: VisitorLogFilters, enabled = true) {
  return useInfiniteQuery<VisitorLogPage>({
    queryKey: hostelAdminKeys.visitorLogs(filters),
    queryFn: ({ pageParam }) =>
      hostelAdminService.listVisitorLogs({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled,
    staleTime: STALE,
  });
}

function useGatepassAction<TArgs>(action: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => qc.invalidateQueries({ queryKey: hostelAdminKeys.all }),
  });
}

export const useApproveGatepass = () =>
  useGatepassAction((id: string) => hostelAdminService.approveGatepass(id));

export const useRejectGatepass = () =>
  useGatepassAction((args: { id: string; reason?: string }) =>
    hostelAdminService.rejectGatepass(args.id, args.reason)
  );

export const useGatepassCheckout = () =>
  useGatepassAction((id: string) => hostelAdminService.gatepassCheckout(id));

export const useGatepassCheckin = () =>
  useGatepassAction((id: string) => hostelAdminService.gatepassCheckin(id));

export const useVisitorCheckOut = () =>
  useGatepassAction((logId: string) => hostelAdminService.visitorCheckOut(logId));

export function useVisitorCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof hostelAdminService.visitorCheckIn>[0]) =>
      hostelAdminService.visitorCheckIn(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: hostelAdminKeys.all }),
  });
}
