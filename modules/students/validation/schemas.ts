import { z } from "zod";

/**
 * Student validation schemas (create / update).
 * Zod `.message()` values are i18n keys under `students:validation.*` — translate at display time.
 */

const studentBaseSchema = {
  name: z.string().min(1, "nameRequired").max(120, "nameTooLong"),
  guardian_name: z
    .string()
    .min(1, "guardianNameRequired")
    .max(100, "guardianNameTooLong"),
  guardian_relationship: z
    .string()
    .min(1, "relationshipRequired")
    .max(50, "relationshipTooLong"),
  guardian_phone: z
    .string()
    .min(1, "guardianPhoneRequired")
    .max(20, "guardianPhoneTooLong"),

  class_id: z.string().uuid("invalidClassId").optional().or(z.literal("")),
  academic_year_id: z
    .string()
    .uuid("invalidAcademicYearId")
    .optional()
    .or(z.literal("")),

  admission_number: z
    .string()
    .max(20, "admissionNumberTooLong")
    .optional(),
  email: z
    .string()
    .email("invalidEmail")
    .max(120, "emailTooLong")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(20, "phoneTooLong").optional().or(z.literal("")),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDateFormat")
    .optional()
    .or(z.literal("")),
  gender: z.string().max(10, "genderTooLong").optional().or(z.literal("")),
  roll_number: z
    .number()
    .int("rollNotInteger")
    .positive("rollNotPositive")
    .optional(),
  address: z.string().optional().or(z.literal("")),
  guardian_email: z
    .string()
    .email("invalidGuardianEmail")
    .max(120, "guardianEmailTooLong")
    .optional()
    .or(z.literal("")),
};

export const createStudentSchema = z
  .object({
    ...studentBaseSchema,
  })
  .refine((data: { class_id?: string; academic_year_id?: string }) => {
    return Boolean(data.class_id?.trim() || data.academic_year_id?.trim());
  }, {
    message: "classOrYearRequired",
    path: ["academic_year_id"],
  })
  .refine(
    (data: { email?: string }) => {
      if (data.email && data.email.trim() === "") return false;
      return true;
    },
    {
      message: "emailEmptyIfProvided",
      path: ["email"],
    },
  );

export const updateStudentSchema = z
  .object({
    name: z.string().min(1, "nameRequired").max(120, "nameTooLong").optional(),
    academic_year_id: z
      .string()
      .uuid("invalidAcademicYearId")
      .optional()
      .or(z.literal(""))
      .nullable(),
    guardian_name: z
      .string()
      .min(1, "guardianNameRequired")
      .max(100, "guardianNameTooLong")
      .optional(),
    guardian_relationship: z
      .string()
      .min(1, "relationshipRequired")
      .max(50, "relationshipTooLong")
      .optional(),
    guardian_phone: z
      .string()
      .min(1, "guardianPhoneRequired")
      .max(20, "guardianPhoneTooLong")
      .optional(),
    email: z
      .string()
      .email("invalidEmail")
      .max(120, "emailTooLong")
      .optional()
      .or(z.literal("")),
    phone: z.string().max(20, "phoneTooLong").optional().or(z.literal("")),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDateFormat")
      .optional()
      .or(z.literal("")),
    gender: z.string().max(10, "genderTooLong").optional().or(z.literal("")),
    class_id: z
      .string()
      .uuid("invalidClassId")
      .optional()
      .or(z.literal(""))
      .nullable(),
    roll_number: z
      .number()
      .int("rollNotInteger")
      .positive("rollNotPositive")
      .optional()
      .nullable(),
    address: z.string().optional().or(z.literal("")),
    guardian_email: z
      .string()
      .email("invalidGuardianEmail")
      .max(120, "guardianEmailTooLong")
      .optional()
      .or(z.literal("")),
  })
  .partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export function validateStudentData(data: unknown, isUpdate: boolean = false) {
  const schema = isUpdate ? updateStudentSchema : createStudentSchema;
  const result = schema.safeParse(data);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const field = err.path[0] as string;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = err.message;
      }
    });

    return {
      valid: false,
      errors: fieldErrors,
      data: null,
    };
  }

  return {
    valid: true,
    errors: {},
    data: result.data,
  };
}
