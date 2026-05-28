import { apiGet } from "@/common/services/api";
import type { AuditFilters, AuditLogPage } from "../types";

export const auditService = {
  async list(
    filters: AuditFilters,
    page = 1,
    pageSize = 20,
  ): Promise<AuditLogPage> {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("page_size", String(pageSize));
    if (filters.date_from) qs.set("date_from", filters.date_from);
    if (filters.date_to) qs.set("date_to", filters.date_to);
    if (filters.module) qs.set("module", filters.module);
    if (filters.action) qs.set("action", filters.action);
    return apiGet<AuditLogPage>(`/api/audit/?${qs.toString()}`);
  },
};
