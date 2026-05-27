import { z } from 'zod';

const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

export const teacherFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email'),
  phone: z.string().trim().regex(PHONE_RE, 'Invalid phone'),
  designation: z.string().trim().min(1, 'Designation is required'),
  department: z.string().trim().optional(),
  qualification: z.string().trim().optional(),
  date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required'),
});

export type TeacherFormInput = z.infer<typeof teacherFormSchema>;
