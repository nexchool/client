import { apiGet } from '@/common/services/api';
import type { WeeklyTimetable } from '../types';

type WeeklyParams = {
  weekStartDate?: string;
  academicYearId?: string;
};

function qs(params: WeeklyParams): string {
  const usp = new URLSearchParams();
  if (params.weekStartDate) usp.set('week_start_date', params.weekStartDate);
  if (params.academicYearId) usp.set('academic_year_id', params.academicYearId);
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const timetableService = {
  getTeacherWeekly: async (params: WeeklyParams = {}) => {
    return await apiGet<WeeklyTimetable>(`/api/timetable/teachers/me/weekly${qs(params)}`);
  },
  getStudentWeekly: async (params: WeeklyParams = {}) => {
    return await apiGet<WeeklyTimetable>(`/api/timetable/students/me/weekly${qs(params)}`);
  },
};
