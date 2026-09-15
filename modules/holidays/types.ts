export type HolidayType = 'public' | 'school' | 'regional' | 'optional' | 'weekly_off';

export interface Holiday {
  id: string;
  name: string;
  description: string | null;
  holiday_type: HolidayType;
  start_date: string | null;   // YYYY-MM-DD
  end_date: string | null;     // YYYY-MM-DD
  is_single_day: boolean;
  duration_days: number;
  is_recurring: boolean;
  recurring_day_of_week: number | null;  // 0-6
  recurring_day_name: string | null;
  falls_on_sunday: boolean;
  academic_year_id: string | null;
  academic_year_name: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  warning?: string;
}
