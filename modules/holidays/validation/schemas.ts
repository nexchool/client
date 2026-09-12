import { z } from 'zod';
import type { CreateHolidayDTO, HolidayType } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type HolidayScheduleKind = 'single' | 'range' | 'recurring';

const HOLIDAY_TYPES = ['public', 'school', 'regional', 'optional', 'weekly_off'] as const;
const SCHEDULE_KINDS = ['single', 'range', 'recurring'] as const;

/** Any function that turns a message key into text — `t` from react-i18next. */
type Translate = (key: string) => string;

/**
 * The shape the form holds while it is being filled in — one flat object,
 * every field always present, which is what react-hook-form wants. The API's
 * shape (a discriminated union on `is_recurring`) is produced from it by
 * `toHolidayPayload` at submit time; a union is right for the wire and wrong
 * for a form, where the person changes their mind about which branch they are
 * on and expects the other fields to still be there.
 *
 * Built by a function rather than declared once so the messages come out in
 * the reader's language: zod resolves them when the schema is constructed, and
 * the form components print `error.message` as-is.
 */
export function buildHolidayFormSchema(t: Translate) {
  return z
    .object({
      schedule: z.enum(SCHEDULE_KINDS),
      name: z
        .string()
        .trim()
        .min(1, t('form.validation.nameRequired'))
        .max(120, t('form.validation.nameMax')),
      description: z.string().max(500, t('form.validation.descriptionMax')),
      holiday_type: z.enum(HOLIDAY_TYPES, { error: t('form.validation.invalidHolidayType') }),
      start_date: z.string(),
      end_date: z.string(),
      /** '' when unset; a weekday index 0–6 as a string otherwise (sheet values are strings). */
      recurring_day_of_week: z.string(),
      /** '' means "all years". */
      academic_year_id: z.string(),
    })
    .superRefine((v, ctx) => {
      if (v.schedule === 'recurring') {
        if (!v.recurring_day_of_week) {
          ctx.addIssue({
            code: 'custom',
            path: ['recurring_day_of_week'],
            message: t('form.validation.dayRequired'),
          });
        }
        return;
      }
      if (!DATE_RE.test(v.start_date)) {
        ctx.addIssue({
          code: 'custom',
          path: ['start_date'],
          message: t('form.validation.startDateFormat'),
        });
      }
      if (v.schedule === 'range') {
        if (!DATE_RE.test(v.end_date)) {
          ctx.addIssue({
            code: 'custom',
            path: ['end_date'],
            message: t('form.validation.endDateFormat'),
          });
        } else if (DATE_RE.test(v.start_date) && v.end_date < v.start_date) {
          ctx.addIssue({
            code: 'custom',
            path: ['end_date'],
            message: t('form.validation.endAfterStart'),
          });
        }
      }
    });
}

export type HolidayFormInput = z.input<ReturnType<typeof buildHolidayFormSchema>>;

export function toHolidayPayload(v: HolidayFormInput): CreateHolidayDTO {
  const base = {
    name: v.name.trim(),
    description: v.description.trim() || undefined,
    holiday_type: v.holiday_type as HolidayType,
    academic_year_id: v.academic_year_id || undefined,
  };
  if (v.schedule === 'recurring') {
    return {
      ...base,
      is_recurring: true,
      recurring_day_of_week: Number(v.recurring_day_of_week),
    };
  }
  return {
    ...base,
    is_recurring: false,
    start_date: v.start_date,
    end_date: v.schedule === 'range' ? v.end_date : undefined,
  };
}
