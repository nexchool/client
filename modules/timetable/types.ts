export interface WeeklyPeriod {
  id: string;
  start_time: string; // "HH:MM"
  end_time: string;
  subject: { id: string; name: string } | null;
  class_section: { id: string; name: string } | null;
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
