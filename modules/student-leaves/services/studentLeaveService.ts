// client/modules/student-leaves/services/studentLeaveService.ts
import { apiGet, apiPost } from '@/common/services/api';
import type {
  StudentLeave,
  StudentLeavePage,
  CreateStudentLeavePayload,
} from '../types';

export const studentLeaveService = {
  list: async (params?: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', String(params.page));
    const qs = q.toString() ? `?${q}` : '';
    return await apiGet<StudentLeavePage>(`/api/student-leaves${qs}`);
  },

  get: async (id: string) => {
    return await apiGet<StudentLeave>(`/api/student-leaves/${id}`);
  },

  create: async (payload: CreateStudentLeavePayload) => {
    return await apiPost<StudentLeave>('/api/student-leaves', payload);
  },

  approve: async (id: string) => {
    return await apiPost<StudentLeave>(`/api/student-leaves/${id}/approve`, {});
  },

  reject: async (id: string, rejection_reason: string) => {
    return await apiPost<StudentLeave>(`/api/student-leaves/${id}/reject`, { rejection_reason });
  },

  requestCancel: async (id: string, reason: string) => {
    return await apiPost<StudentLeave>(`/api/student-leaves/${id}/request-cancel`, { reason });
  },

  approveCancel: async (id: string) => {
    return await apiPost<StudentLeave>(`/api/student-leaves/${id}/approve-cancel`, {});
  },

  rejectCancel: async (id: string) => {
    return await apiPost<StudentLeave>(`/api/student-leaves/${id}/reject-cancel`, {});
  },

  teacherQueue: async () => {
    return await apiGet<StudentLeave[]>('/api/student-leaves/queue/me');
  },

  adminQueue: async () => {
    return await apiGet<StudentLeave[]>('/api/student-leaves/queue/admin');
  },
};
