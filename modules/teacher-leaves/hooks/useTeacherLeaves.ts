// client/modules/teacher-leaves/hooks/useTeacherLeaves.ts
//
// Two APIs live here during the leave rebuild.
//
//   - The TanStack Query hooks below are the ones to use. Mutations invalidate
//     `teacherLeavesKeys.all`, so a screen never refetches by hand.
//   - `useTeacherLeaves` beneath them is the original hand-rolled
//     useState/useCallback store. It is still the whole API for
//     `TeacherLeavesScreen` (the admin queue, which also drives balance
//     adjustment and policy editing) and for `TeacherDetailScreen`. Those two
//     move across when those screens are rebuilt; until then this stays, and
//     nothing new should be added to it.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { TeacherLeave, CreateLeaveDTO, LeaveBalance, LeavePolicy, AdjustLeaveBalanceDTO, UpdateLeavePolicyDTO } from '@/modules/teachers/types';
import {
  teacherLeaveService,
  teacherLeaveBalanceService,
  leavePolicyService,
} from '@/modules/teachers/services/teacherConstraintService';

export const teacherLeavesKeys = {
  all: ['teacher-leaves'] as const,
  myList: (status?: string) => ['teacher-leaves', 'my', status ?? ''] as const,
  list: (params?: { teacher_id?: string; status?: string }) =>
    ['teacher-leaves', 'list', params?.teacher_id ?? '', params?.status ?? ''] as const,
  myBalances: () => ['teacher-leaves', 'balances', 'my'] as const,
  policies: () => ['teacher-leaves', 'policies'] as const,
};

export function useMyTeacherLeaves(status?: string, enabled = true) {
  return useQuery<TeacherLeave[]>({
    queryKey: teacherLeavesKeys.myList(status),
    queryFn: () => teacherLeaveService.getMyLeaves(status ? { status } : undefined),
    enabled,
  });
}

export function useTeacherLeavesList(
  params?: { teacher_id?: string; status?: string },
  enabled = true,
) {
  return useQuery<TeacherLeave[]>({
    queryKey: teacherLeavesKeys.list(params),
    queryFn: () => teacherLeaveService.listLeaves(params),
    enabled,
  });
}

export function useMyLeaveBalances(enabled = true) {
  return useQuery<LeaveBalance[]>({
    queryKey: teacherLeavesKeys.myBalances(),
    queryFn: () => teacherLeaveBalanceService.getMyBalances(),
    enabled,
  });
}

export function useLeavePolicies(enabled = true) {
  return useQuery<LeavePolicy[]>({
    queryKey: teacherLeavesKeys.policies(),
    queryFn: () => leavePolicyService.getPolicies(),
    enabled,
  });
}

/** Applying spends balance, so both the list and the balances go stale. */
export function useCreateTeacherLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeaveDTO) => teacherLeaveService.createLeave(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherLeavesKeys.all });
    },
  });
}

/** Cancelling returns the days, so the same two go stale. */
export function useCancelTeacherLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaveId: string) => teacherLeaveService.cancelLeave(leaveId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherLeavesKeys.all });
    },
  });
}

export function useApproveTeacherLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaveId: string) => teacherLeaveService.approveLeave(leaveId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherLeavesKeys.all });
    },
  });
}

export function useRejectTeacherLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaveId: string) => teacherLeaveService.rejectLeave(leaveId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherLeavesKeys.all });
    },
  });
}


/**
 * @deprecated Hand-rolled store predating TanStack Query in this app. Still the
 * whole API for `TeacherLeavesScreen` and `TeacherDetailScreen`; use the query
 * hooks above for anything new.
 */
export function useTeacherLeaves() {
  const [leaves, setLeaves] = useState<TeacherLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);

  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // --- Leave list ---

  const fetchLeaves = useCallback(async (params?: { teacher_id?: string; status?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherLeaveService.listLeaves(params);
      setLeaves(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyLeaves = useCallback(async (params?: { status?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherLeaveService.getMyLeaves(params);
      setLeaves(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeave = useCallback(async (dto: CreateLeaveDTO) => {
    const item = await teacherLeaveService.createLeave(dto);
    setLeaves(prev => [item, ...prev]);
    // Optimistically mark balance as stale so it'll refresh
    setBalances([]);
    return item;
  }, []);

  const cancelLeave = useCallback(async (leaveId: string) => {
    const item = await teacherLeaveService.cancelLeave(leaveId);
    setLeaves(prev => prev.map(l => l.id === leaveId ? item : l));
    setBalances([]);
    return item;
  }, []);

  const approveLeave = useCallback(async (leaveId: string) => {
    const item = await teacherLeaveService.approveLeave(leaveId);
    setLeaves(prev => prev.map(l => l.id === leaveId ? item : l));
    return item;
  }, []);

  const rejectLeave = useCallback(async (leaveId: string) => {
    const item = await teacherLeaveService.rejectLeave(leaveId);
    setLeaves(prev => prev.map(l => l.id === leaveId ? item : l));
    return item;
  }, []);

  // --- Leave balances ---

  const fetchMyBalances = useCallback(async (academicYear?: string) => {
    try {
      setBalancesLoading(true);
      const data = await teacherLeaveBalanceService.getMyBalances(
        academicYear ? { academic_year: academicYear } : undefined
      );
      setBalances(data);
    } catch {
      // silently fail — balances are supplemental, not critical
    } finally {
      setBalancesLoading(false);
    }
  }, []);

  const fetchTeacherBalances = useCallback(async (teacherId: string, academicYear?: string) => {
    try {
      setBalancesLoading(true);
      const data = await teacherLeaveBalanceService.getTeacherBalances(
        teacherId,
        academicYear ? { academic_year: academicYear } : undefined
      );
      setBalances(data);
    } catch {
      setBalances([]);
    } finally {
      setBalancesLoading(false);
    }
  }, []);

  const adjustBalance = useCallback(
    async (teacherId: string, leaveType: string, dto: AdjustLeaveBalanceDTO) => {
      const updated = await teacherLeaveBalanceService.adjustBalance(teacherId, leaveType, dto);
      setBalances(prev =>
        prev.map(b => b.leave_type === leaveType ? { ...b, ...updated } : b)
      );
      return updated;
    },
    []
  );

  // --- Leave policies ---

  const fetchPolicies = useCallback(async () => {
    try {
      setPoliciesLoading(true);
      const data = await leavePolicyService.getPolicies();
      setPolicies(data);
    } catch {
      setPolicies([]);
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  const updatePolicy = useCallback(async (leaveType: string, dto: UpdateLeavePolicyDTO) => {
    const updated = await leavePolicyService.updatePolicy(leaveType, dto);
    setPolicies(prev =>
      prev.map(p => p.leave_type === leaveType ? { ...p, ...updated } : p)
    );
    return updated;
  }, []);

  return {
    // Leaves
    leaves,
    loading,
    error,
    fetchLeaves,
    fetchMyLeaves,
    createLeave,
    cancelLeave,
    approveLeave,
    rejectLeave,
    // Balances
    balances,
    balancesLoading,
    fetchMyBalances,
    fetchTeacherBalances,
    adjustBalance,
    // Policies
    policies,
    policiesLoading,
    fetchPolicies,
    updatePolicy,
  };
}
