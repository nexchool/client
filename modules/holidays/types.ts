import type { Palette } from '@/common/theme';

export type HolidayType = 'public' | 'school' | 'regional' | 'optional' | 'weekly_off';

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  public: 'Public',
  school: 'School',
  regional: 'Regional',
  optional: 'Optional',
  weekly_off: 'Weekly Off',
};

/** Palette token used to accent each holiday type (left stripe + badge). */
export const HOLIDAY_TYPE_ACCENTS: Record<HolidayType, keyof Palette> = {
  public: 'error',
  school: 'primary',
  regional: 'warning',
  optional: 'onSurfaceVariant',
  weekly_off: 'success',
};

export const DAY_NAMES: Record<number, string> = {
  0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday',
  4: 'Friday', 5: 'Saturday', 6: 'Sunday',
};

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

export interface CreateHolidayDTO {
  name: string;
  description?: string;
  holiday_type: HolidayType;
  // Non-recurring
  start_date?: string;
  end_date?: string;
  // Recurring
  is_recurring: boolean;
  recurring_day_of_week?: number;
  academic_year_id?: string;
}
