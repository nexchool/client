import { useQuery } from "@tanstack/react-query";
import { academicStructureService } from "../services/academicStructureService";

const KEYS = ["academics", "mediums"] as const;

export function useMediums() {
  return useQuery({
    queryKey: KEYS,
    queryFn: () => academicStructureService.getMediums(),
  });
}
