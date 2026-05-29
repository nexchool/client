import { apiGet } from '@/common/services/api';
import type { AdminDashboard } from '../types';

export const dashboardService = {
  /** Admin home aggregate. `apiGet` returns the unwrapped `data` object directly. */
  getAdmin: (): Promise<AdminDashboard> => apiGet<AdminDashboard>('/api/dashboard/'),
};
