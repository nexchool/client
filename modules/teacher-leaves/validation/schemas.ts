// client/modules/teacher-leaves/validation/schemas.ts
import { z } from 'zod';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const createTeacherLeaveSchema = z
  .object({
    leave_type: z.enum(['casual', 'sick', 'emergency', 'unpaid', 'other']),
    start_date: z.string().regex(ISO_DATE_RE, 'Start date required'),
    end_date: z.string().regex(ISO_DATE_RE, 'End date required'),
    reason: z.string().trim().max(500, 'Reason is too long').optional(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    path: ['end_date'],
    message: 'End date must be on or after start date',
  });

export type CreateTeacherLeaveInput = z.infer<typeof createTeacherLeaveSchema>;
