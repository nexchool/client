import { apiGet } from "@/common/services/api";

export interface ClassOption {
  id: string;
  name: string;
  section?: string;
}

export const financeClassService = {
  getClasses: async (): Promise<ClassOption[]> => {
    try {
      // The endpoint answers with an envelope; the `[]` fallback below meant
      // this picker was silently empty rather than wrong.
      const res = await apiGet<{ items: ClassOption[] } | ClassOption[]>(
        "/api/classes/"
      );
      return Array.isArray(res) ? res : res?.items ?? [];
    } catch {
      return [];
    }
  },
};
