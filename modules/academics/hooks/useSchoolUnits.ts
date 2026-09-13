import { useQuery } from "@tanstack/react-query";
import { academicStructureService } from "../services/academicStructureService";

const KEYS = ["academics", "schoolUnits"] as const;

export function useSchoolUnits() {
  return useQuery({
    queryKey: KEYS,
    queryFn: () => academicStructureService.getCampuses(),
  });
}
