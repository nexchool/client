import { useInfiniteQuery } from "@tanstack/react-query";
import { auditService } from "../services/auditService";
import type { AuditFilters, AuditLogPage } from "../types";

export function useAuditLogs(filters: AuditFilters) {
  return useInfiniteQuery<AuditLogPage>({
    queryKey: ["audit", "list", filters],
    queryFn: ({ pageParam }) =>
      auditService.list(filters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}
