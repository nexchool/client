import { apiGet } from "@/common/services/api";

export interface ClassOption {
  id: string;
  /** Nullable server-side — read `display_name` for what to show. */
  name: string | null;
  /** What the school calls this class ("5 A"), composed server-side. */
  display_name?: string | null;
  section?: string;
  /**
   * How the class is scoped. The endpoint has always returned these; this
   * type stopped short of them, so every picker built on it could only offer
   * "1 A" — three times over in a trust with three programmes, with no way to
   * tell which was which. See `classScopeLabel`.
   */
  school_unit_name?: string | null;
  programme_name?: string | null;
  medium_name?: string | null;
  stream?: string | null;
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
