import { z } from 'zod';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const scheduleOverrideSchema = z.discriminatedUnion('override_type', [
  z.object({
    slot_id: z.string().min(1, 'Class period is required'),
    override_date: z.string().regex(ISO_DATE_RE, 'Date is required'),
    override_type: z.literal('cancelled'),
    reason: z.string().trim().optional(),
  }),
  z.object({
    slot_id: z.string().min(1, 'Class period is required'),
    override_date: z.string().regex(ISO_DATE_RE, 'Date is required'),
    override_type: z.literal('substitute'),
    substitute_teacher_id: z.string().min(1, 'Substitute teacher is required'),
    reason: z.string().trim().optional(),
  }),
  z.object({
    slot_id: z.string().min(1, 'Class period is required'),
    override_date: z.string().regex(ISO_DATE_RE, 'Date is required'),
    override_type: z.literal('activity'),
    activity_note: z.string().trim().min(1, 'Activity description is required'),
    reason: z.string().trim().optional(),
  }),
]);

export type ScheduleOverrideInput = z.infer<typeof scheduleOverrideSchema>;
