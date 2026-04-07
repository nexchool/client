import { apiDelete, apiGet, apiPost, apiPut } from '@/common/services/api';
import type { TeacherTodayScheduleResponse } from '@/modules/academics/types';
import { Teacher, CreateTeacherDTO, UpdateTeacherDTO, CreateTeacherResponse } from '../types';

export const teacherService = {
  getTeachers: async (params?: { search?: string; status?: string }) => {
    let url = '/api/teachers/';
    if (params) {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }
    return await apiGet<Teacher[]>(url);
  },

  getTeacher: async (id: string) => {
    return await apiGet<Teacher>(`/api/teachers/${id}`);
  },

  getMyProfile: async () => {
    return await apiGet<Teacher>('/api/teachers/me');
  },

  getTodaySchedule: async () => {
    return await apiGet<TeacherTodayScheduleResponse>('/api/teachers/me/today-schedule');
  },

  createTeacher: async (data: CreateTeacherDTO) => {
    return await apiPost<CreateTeacherResponse>('/api/teachers', data);
  },

  updateTeacher: async (id: string, data: UpdateTeacherDTO) => {
    return await apiPut<Teacher>(`/api/teachers/${id}`, data);
  },

  deleteTeacher: async (id: string) => {
    return await apiDelete<void>(`/api/teachers/${id}`);
  },
};
