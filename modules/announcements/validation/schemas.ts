import { z } from 'zod';

export const audienceSchema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('all') }),
  z.object({
    scope: z.literal('roles'),
    roles: z.array(z.enum(['admin', 'teacher', 'student', 'parent'])).min(1, 'Pick at least one role'),
  }),
  z.object({
    scope: z.literal('classes'),
    class_ids: z.array(z.string()).min(1, 'Pick at least one class'),
  }),
  z.object({
    scope: z.literal('students'),
    student_ids: z.array(z.string()).min(1, 'Pick at least one student'),
  }),
]);

export const composeAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title required').max(255, 'Title too long'),
  body_markdown: z.string().trim().min(1, 'Body required'),
  audience_json: audienceSchema,
});

export type ComposeAnnouncementInput = z.infer<typeof composeAnnouncementSchema>;
