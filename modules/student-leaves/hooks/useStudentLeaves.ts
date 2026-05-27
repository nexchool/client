// client/modules/student-leaves/hooks/useStudentLeaves.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentLeaveService } from '../services/studentLeaveService';
import type { CreateStudentLeavePayload } from '../types';

export const studentLeavesKeys = {
  all: ['student-leaves'] as const,
  list: (status?: string) => ['student-leaves', 'list', status ?? ''] as const,
  detail: (id: string) => ['student-leaves', 'detail', id] as const,
  teacherQueue: () => ['student-leaves', 'queue', 'me'] as const,
  adminQueue: () => ['student-leaves', 'queue', 'admin'] as const,
};

export function useMyStudentLeaves(status?: string) {
  return useQuery({
    queryKey: studentLeavesKeys.list(status),
    queryFn: () => studentLeaveService.list({ status }),
  });
}

export function useStudentLeave(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: studentLeavesKeys.detail(id ?? ''),
    queryFn: () => studentLeaveService.get(id!),
    enabled: enabled && !!id,
  });
}

export function useTeacherQueue() {
  return useQuery({
    queryKey: studentLeavesKeys.teacherQueue(),
    queryFn: () => studentLeaveService.teacherQueue(),
  });
}

export function useAdminFallbackQueue() {
  return useQuery({
    queryKey: studentLeavesKeys.adminQueue(),
    queryFn: () => studentLeaveService.adminQueue(),
  });
}

export function useCreateStudentLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentLeavePayload) => studentLeaveService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentLeavesKeys.all }),
  });
}

export function useApproveStudentLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentLeaveService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentLeavesKeys.all });
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useRejectStudentLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      studentLeaveService.reject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentLeavesKeys.all }),
  });
}

export function useRequestCancelStudentLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      studentLeaveService.requestCancel(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentLeavesKeys.all }),
  });
}

export function useApproveCancelStudentLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentLeaveService.approveCancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentLeavesKeys.all });
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useRejectCancelStudentLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentLeaveService.rejectCancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentLeavesKeys.all }),
  });
}
