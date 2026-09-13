import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { academicStructureService } from "../services/academicStructureService";

const KEYS = ["academics", "grades"] as const;

export function useGrades() {
  return useQuery({
    queryKey: KEYS,
    queryFn: () => academicStructureService.getGrades(),
  });
}

/** Adds a grade on the fly — e.g. typing "11" in Create Class when it doesn't exist yet. */
export function useCreateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => academicStructureService.addGrade(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS });
    },
  });
}
