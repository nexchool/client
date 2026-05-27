// client/modules/student-leaves/validation/schemas.ts
import { z } from 'zod';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const createStudentLeaveSchema = z
  .object({
    leave_type: z.enum(['sick', 'medical', 'family', 'religious', 'other']),
    start_date: z.string().regex(ISO_DATE_RE, 'Start date required'),
    end_date: z.string().regex(ISO_DATE_RE, 'End date required'),
    half_day: z.enum(['full', 'am', 'pm']),
    reason: z.string().trim().min(1, 'Reason is required').max(500, 'Reason is too long'),
    attachment_document_id: z.string().optional(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    path: ['end_date'],
    message: 'End date must be on or after start date',
  })
  .refine(
    (v) => v.half_day === 'full' || v.start_date === v.end_date,
    {
      path: ['half_day'],
      message: 'Half-day requires a single-day request',
    },
  );

export type CreateStudentLeaveInput = z.infer<typeof createStudentLeaveSchema>;
