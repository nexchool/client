import { z } from 'zod';
import { PHONE_NUMBER_REGEX } from '@/common/utils/phone';

// Optional; when given, the field's own input filter (see TeacherFormScreen)
// only ever lets digits through and caps at 10, so this mainly guards a value
// that arrives some other way (edit-mode hydration from previously stored data).
const phoneField = z
  .string()
  .trim()
  .refine((value) => value === '' || PHONE_NUMBER_REGEX.test(value), {
    message: 'Enter a valid 10-digit phone number',
  });

export const teacherFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email'),
  phone: phoneField,
  designation: z.string().trim().min(1, 'Designation is required'),
  department: z.string().trim().optional(),
  qualification: z.string().trim().optional(),
  date_of_joining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required'),
});

export type TeacherFormInput = z.infer<typeof teacherFormSchema>;
