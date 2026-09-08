import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

/**
 * Exported because money moves from outside this module.
 *
 * The admin aggregate carries `finance.last_7_days_collection` — the bars on
 * the fee-collection chart — so recording a payment changes it, and the
 * mutation that records it lives in `modules/finance`. Until this key was
 * exported, those mutations invalidated every *finance* key and none of this
 * one, so a payment updated the totals beside the chart while the chart
 * itself kept yesterday's bars. It looked like a chart that never refreshed;
 * it was a chart nobody told.
 *
 * Anything that moves money invalidates this. Keeping the key here rather
 * than repeating the literal at each call site is what makes that findable.
 */
export const dashboardKeys = {
  admin: ['dashboard', 'admin'] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.admin,
    queryFn: dashboardService.getAdmin,
  });
}
