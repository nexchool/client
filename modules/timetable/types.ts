export interface WeeklyPeriod {
  id: string;
  period_number?: number | null;
  start_time: string; // "HH:MM"
  end_time: string;
  subject: { id: string; name: string } | null;
  // Server's weekly serializer returns this under `class` (teacher view).
  class: { id: string; name: string | null } | null;
  teacher: { id: string; name: string } | null;
  room: string | null;
}

export interface WeeklyDay {
  day_of_week: number; // 0=Mon..6=Sun
  date: string; // ISO YYYY-MM-DD
  periods: WeeklyPeriod[];
}

export interface WeeklyTimetable {
  academic_year: { id: string; name: string };
  week_start_date: string;
  week_end_date: string;
  days: WeeklyDay[];
}
