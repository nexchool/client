import type { Palette } from '@/common/theme/palettes';

/** What the school is doing on one day. Mirrors the server's days feed. */
export type CalendarDayType =
  | 'working'
  | 'weekly_holiday'
  | 'public_holiday'
  | 'vacation';

export interface CalendarDayHoliday {
  id: string;
  name: string;
  holidayType: string | null;
}

export interface CalendarDay {
  /** ISO yyyy-mm-dd. */
  date: string;
  dayType: CalendarDayType;
  hasExam: boolean;
  hasEvent: boolean;
  /** The name of the term starting/ending on this day, or null. */
  semesterStart: string | null;
  semesterEnd: string | null;
  holidays: CalendarDayHoliday[];
}

export interface CalendarSummary {
  totalDays: number;
  workingDays: number;
  publicHolidayDays: number;
  weeklyHolidayDays: number;
  vacationDays: number;
  examDays: number;
}

export interface CalendarEvent {
  id: string;
  name: string;
  eventType: string | null;
  description: string | null;
  eventDate: string | null;
  appliesTo: string | null;
}

export interface CalendarExamWindow {
  id: string;
  name: string;
  examType: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CurrentCalendar {
  id: string;
  status: string;
  academicYearId: string;
  academicYearName: string | null;
  summary: CalendarSummary | null;
  days: CalendarDay[];
  events: CalendarEvent[];
  examWindows: CalendarExamWindow[];
}

/** One thing happening on the selected day. */
export type CalendarEntryKind =
  | 'holiday'
  | 'vacation'
  | 'weeklyOff'
  | 'exam'
  | 'event'
  | 'term';

/**
 * The colour each kind carries, as palette keys — the same mapping the grid's
 * dots and the day list's cards both read, so a red dot and a red card edge
 * always mean the same thing.
 */
export const ENTRY_ACCENTS: Record<CalendarEntryKind, keyof Palette> = {
  holiday: 'error',
  vacation: 'tertiary',
  weeklyOff: 'onSurfaceVariant',
  exam: 'warning',
  event: 'success',
  term: 'primary',
};

export const ENTRY_ICONS: Record<CalendarEntryKind, string> = {
  holiday: 'flag-outline',
  vacation: 'sunny-outline',
  weeklyOff: 'moon-outline',
  exam: 'document-text-outline',
  event: 'sparkles-outline',
  term: 'bookmark-outline',
};

/** The day's own classification, as an entry kind. Null = an ordinary day. */
export function kindForDayType(dayType: CalendarDayType): CalendarEntryKind | null {
  if (dayType === 'vacation') return 'vacation';
  if (dayType === 'public_holiday') return 'holiday';
  if (dayType === 'weekly_holiday') return 'weeklyOff';
  return null;
}
