/**
 * Date/time formatting helpers. Uses Intl.DateTimeFormat (available in the
 * Hermes runtime — the same approach as formatCurrency). All inputs are ISO
 * 8601 strings from the API; invalid/empty inputs render as an em dash.
 *
 * **Every formatter here is pinned to the school's clock, not the phone's.**
 * The API sends instants in UTC with the offset attached (`+00:00`), which is
 * correct storage — but `Intl` formats in whatever zone the device is set to,
 * so a parent whose phone was on Dubai or London time read every "published
 * at" and "paid at" in that zone. Every school on the platform is in India,
 * so the display zone is Asia/Kolkata regardless of the device.
 *
 * Calendar dates — an attendance day, a holiday, a due date — are `YYYY-MM-DD`
 * strings with no time and no zone, and must never be shifted. They parse as
 * UTC midnight, which in IST is 05:30 the *same* day, so passing them through
 * these formatters is safe; but the screens that build a `Date` from local
 * parts (`new Date(y, m, d)`) format it locally on purpose and do not come
 * through here.
 */

/**
 * Where the tenant's `timezone` column will plug in once the session payload
 * carries it; today the server defaults every school to this same zone.
 */
export const SCHOOL_TIMEZONE = "Asia/Kolkata";

const LOCALE = "en-IN";
const tz = { timeZone: SCHOOL_TIMEZONE } as const;

const dateFmt = new Intl.DateTimeFormat(LOCALE, { ...tz, day: "2-digit", month: "short", year: "numeric" });
const dayMonthFmt = new Intl.DateTimeFormat(LOCALE, { ...tz, day: "numeric", month: "short" });
const dateLongFmt = new Intl.DateTimeFormat(LOCALE, { ...tz, weekday: "long", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { ...tz, hour: "numeric", minute: "2-digit", hour12: true });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  ...tz,
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dateTimeFullFmt = new Intl.DateTimeFormat(LOCALE, {
  ...tz,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

type DateInput = string | Date | null | undefined;

// Calendar dates as `YYYY-MM-DD`, the shape the API speaks for a school day.
const isoDayFmt = new Intl.DateTimeFormat("en-CA", { ...tz, year: "numeric", month: "2-digit", day: "2-digit" });
const isoMonthFmt = new Intl.DateTimeFormat("en-CA", { ...tz, year: "numeric", month: "2-digit" });

/**
 * Today's date *at the school*, as `YYYY-MM-DD`.
 *
 * The idiom this replaces — `new Date().toISOString().slice(0, 10)` — is the
 * UTC date, on every device, everywhere. At 02:30 on a Saturday in India it
 * says Friday, so a teacher marking attendance in the small hours was
 * marking yesterday, and a fee recorded then was dated the day before it
 * was taken. Use this for any "today" that is about the school day.
 */
export function schoolTodayIso(): string {
  return isoDayFmt.format(new Date());
}

/** The calendar day an instant falls on *at the school*, as `YYYY-MM-DD`. */
export function toSchoolDateIso(value: DateInput): string | null {
  const d = parse(value);
  return d ? isoDayFmt.format(d) : null;
}

/** This month at the school, as `YYYY-MM`. */
export function schoolMonthIso(): string {
  return isoMonthFmt.format(new Date());
}

/**
 * A `Date` built from local parts (`new Date(y, m, d)`, `setDate(...)`) as
 * `YYYY-MM-DD`, read back through the same local getters. `toISOString()` on
 * such a Date converts to UTC first, which in India lands on the previous
 * day for anything before 05:30 — including the midnight those Dates are
 * usually built at.
 */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const wallClockFmt = new Intl.DateTimeFormat("en-CA", {
  ...tz, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

/**
 * The school's clock right now (or at `at`): the calendar day and the minutes
 * since its midnight. This is what "is this period happening now" and "which
 * class is up next" must be judged against — `new Date().getHours()` is the
 * phone's clock, which for a phone set to another zone is a different
 * afternoon entirely.
 */
export function schoolNow(at: Date = new Date()): { iso: string; minutes: number } {
  const parts = Object.fromEntries(wallClockFmt.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    iso: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Minutes since midnight on the school's clock. */
export function schoolNowMinutes(at: Date = new Date()): number {
  return schoolNow(at).minutes;
}

/**
 * Weekday of a `YYYY-MM-DD` (0 = Sunday … 6 = Saturday, like `getDay`), read
 * in UTC so the answer does not depend on the device's zone. `new Date(iso)`
 * is UTC midnight, and `.getDay()` on it is the *local* weekday of that
 * instant — the day before, anywhere west of Greenwich.
 */
export function weekdayOfIso(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/** The Monday of the week that `iso` falls in. */
export function isoMondayOf(iso: string): string {
  return addDaysIso(iso, -((weekdayOfIso(iso) + 6) % 7));
}

/** `iso` plus `delta` days, done in UTC so no zone can move it. */
export function addDaysIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function parse(value: DateInput): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `12 Sep 2026` */
export function formatDate(value: DateInput): string {
  const d = parse(value);
  return d ? dateFmt.format(d) : "—";
}

/** `12 Sep` — for a row that already sits under a year. */
export function formatDayMonth(value: DateInput): string {
  const d = parse(value);
  return d ? dayMonthFmt.format(d) : "—";
}

/** `Saturday, 12 Sep` — the dashboard's "today". */
export function formatDateLong(value: DateInput): string {
  const d = parse(value);
  return d ? dateLongFmt.format(d) : "—";
}

/** `4:32 pm` */
export function formatTime(value: DateInput): string {
  const d = parse(value);
  return d ? timeFmt.format(d) : "—";
}

/** `12 Sep, 4:32 pm` — for a list row. */
export function formatDateTime(value: DateInput): string {
  const d = parse(value);
  return d ? dateTimeFmt.format(d) : "—";
}

/** `12 Sep 2026, 4:32 pm` — for a detail screen, where the year matters. */
export function formatDateTimeFull(value: DateInput): string {
  const d = parse(value);
  return d ? dateTimeFullFmt.format(d) : "—";
}
