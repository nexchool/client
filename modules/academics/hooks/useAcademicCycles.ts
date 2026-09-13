import { useQuery } from "@tanstack/react-query";
import { academicStructureService } from "../services/academicStructureService";

const KEYS = ["academics", "academicCycles"] as const;

/** Doesn't fire until a year is chosen — there's nothing to ask the server yet. */
export function useAcademicCycles(academicYearId: string) {
  return useQuery({
    queryKey: [...KEYS, academicYearId],
    queryFn: () => academicStructureService.getAcademicCycles(academicYearId),
    enabled: !!academicYearId,
  });
}
