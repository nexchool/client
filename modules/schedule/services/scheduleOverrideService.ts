import { apiPost } from '@/common/services/api';
import type { ScheduleOverrideInput } from '../validation/schemas';

export const scheduleOverrideService = {
  create: async (input: ScheduleOverrideInput) => {
    return await apiPost<{ id: string }>('/api/schedule/override', input);
  },
};
