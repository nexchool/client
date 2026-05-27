import { useQuery } from '@tanstack/react-query';
import { transportService } from '../services/transportService';
import type { StudentTransport } from '../types';

const queryKeys = {
  studentMe: () => ['transport', 'student-me'] as const,
};

export function useStudentTransport(enabled = true) {
  return useQuery<StudentTransport>({
    queryKey: queryKeys.studentMe(),
    queryFn: () => transportService.getStudentMyTransport(),
    enabled,
    staleTime: 60_000,
  });
}
