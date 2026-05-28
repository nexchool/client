export interface AuditLogEntry {
  id: string;
  created_at: string | null;
  actor_user_id: string | null;
  actor_name: string;
  actor_role: string;
  module: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string;
  unit_id: string | null;
  meta: Record<string, unknown> | null;
}

export interface AuditPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  pagination: AuditPagination;
}

export interface AuditFilters {
  date_from?: string;
  date_to?: string;
  module?: string;
  action?: string;
}
