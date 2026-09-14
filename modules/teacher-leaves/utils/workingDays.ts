// client/modules/teacher-leaves/utils/workingDays.ts
import { holidayService } from '@/modules/holidays/services/holidayService';
import { addDaysIso, weekdayOfIso } from '@/common/utils/datetime';

export type WorkingDaysEstimate = {
  /** Every day in the range, holidays included. */
  totalDays: number;
  /** Days the school is actually open — what the leave will cost. */
  workingDays: number;
  /** Days excluded because the school is closed. */
  excludedDays: number;
};

/**
 * How many days of balance a date range will actually spend.
 *
 * A teacher asking for Friday to Monday over a long weekend is not spending
 * four days, and being told so before they submit is the difference between a
 * considered request and a surprise.
 *
 * Dates are compared as `YYYY-MM-DD` strings throughout and stepped with
 * `addDaysIso`. The version this replaces built `new Date(iso)` and called
 * `toISOString().slice(0,10)` to step the range — that is the UTC day, so
 * every date in the calculation could land one day early depending on the
 * hour the teacher opened the form.
 */
export async function estimateWorkingDays(
  startIso: string,
  endIso: string,
): Promise<WorkingDaysEstimate> {
  const [nonRecurring, recurring] = await Promise.all([
    holidayService.getHolidays({
      start_date: startIso,
      end_date: endIso,
      include_recurring: false,
    }),
    holidayService.getRecurring(),
  ]);

  const closed = new Set<string>();
  const recurringWeekdays = new Set(
    recurring
      .map((r) => r.recurring_day_of_week)
      .filter((d): d is number => d != null),
  );

  let total = 0;
  for (let day = startIso; day <= endIso; day = addDaysIso(day, 1)) {
    total += 1;

    if (recurringWeekdays.has(weekdayOfIso(day))) {
      closed.add(day);
      continue;
    }
    const insideHoliday = nonRecurring.some((h) => {
      if (!h.start_date) return false;
      const from = h.start_date;
      const to = h.end_date || h.start_date;
      return day >= from && day <= to;
    });
    if (insideHoliday) closed.add(day);
  }

  return {
    totalDays: total,
    workingDays: total - closed.size,
    excludedDays: closed.size,
  };
}
