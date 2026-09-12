import { useQuery } from "@tanstack/react-query";
import { academicStructureService } from "../services/academicStructureService";

const KEYS = ["academics", "programmes"] as const;

export function useProgrammes() {
  return useQuery({
    queryKey: KEYS,
    queryFn: () => academicStructureService.getProgrammes(),
  });
}
