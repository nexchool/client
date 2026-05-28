import { useQuery } from "@tanstack/react-query";
import { subjectService } from "../services/subjectService";
import type { MySubject } from "../types";

// Tenant scoping is enforced at the API-client level in this Expo client:
// `apiRequest` injects the active `X-Tenant-ID` header (common/services/api.ts),
// and only one tenant is stored per session (common/utils/storage.ts).
// The Next.js `useTenantQuery` wrapper from query-conventions.md does not exist here.
export function useMySubjects() {
  return useQuery<MySubject[]>({
    queryKey: ["subjects", "mine"],
    queryFn: () => subjectService.listMySubjects(),
  });
}
