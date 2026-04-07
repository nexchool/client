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

  // Health / Physical
  blood_group: z.string().max(10, "bloodGroupTooLong").optional().or(z.literal("")),
  height_cm: z
    .preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int("heightNotInteger").min(0, "heightNotPositive").max(300, "heightTooLarge").optional())
    .optional(),
  weight_kg: z
    .preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(0, "weightNotPositive").max(500, "weightTooLarge").optional())
    .optional(),
  medical_allergies: z.string().optional().or(z.literal("")),
  medical_conditions: z.string().optional().or(z.literal("")),
  disability_details: z.string().optional().or(z.literal("")),
  identification_marks: z.string().optional().or(z.literal("")),

  // Parent / Family
  father_name: z.string().max(120, "fatherNameTooLong").optional().or(z.literal("")),
  father_phone: z.string().max(20, "fatherPhoneTooLong").optional().or(z.literal("")),
  father_email: z.string().email("invalidFatherEmail").max(120, "fatherEmailTooLong").optional().or(z.literal("")),
  father_occupation: z.string().max(120, "fatherOccupationTooLong").optional().or(z.literal("")),
  father_annual_income: z
    .preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int("incomeNotInteger").min(0, "incomeNotPositive").optional())
    .optional(),

  mother_name: z.string().max(120, "motherNameTooLong").optional().or(z.literal("")),
  mother_phone: z.string().max(20, "motherPhoneTooLong").optional().or(z.literal("")),
  mother_email: z.string().email("invalidMotherEmail").max(120, "motherEmailTooLong").optional().or(z.literal("")),
  mother_occupation: z.string().max(120, "motherOccupationTooLong").optional().or(z.literal("")),
  mother_annual_income: z
    .preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int("incomeNotInteger").min(0, "incomeNotPositive").optional())
    .optional(),

  guardian_address: z.string().optional().or(z.literal("")),
  guardian_occupation: z.string().max(120, "guardianOccupationTooLong").optional().or(z.literal("")),
  guardian_aadhar_number: z.string().max(20, "guardianAadharTooLong").optional().or(z.literal("")),

  // Identity / Demographic
  aadhar_number: z.string().max(20, "aadharTooLong").optional().or(z.literal("")),
  apaar_id: z.string().max(50, "apaarTooLong").optional().or(z.literal("")),
  emis_number: z.string().max(50, "emisTooLong").optional().or(z.literal("")),
  udise_student_id: z.string().max(50, "udiseTooLong").optional().or(z.literal("")),
  religion: z.string().max(50, "religionTooLong").optional().or(z.literal("")),
  category: z.string().max(50, "categoryTooLong").optional().or(z.literal("")),
  caste: z.string().max(50, "casteTooLong").optional().or(z.literal("")),
  nationality: z.string().max(50, "nationalityTooLong").optional().or(z.literal("")),
  mother_tongue: z.string().max(50, "motherTongueTooLong").optional().or(z.literal("")),
  place_of_birth: z.string().max(120, "placeOfBirthTooLong").optional().or(z.literal("")),

  // Residence / Address
  current_address: z.string().optional().or(z.literal("")),
  current_city: z.string().max(80, "currentCityTooLong").optional().or(z.literal("")),
  current_state: z.string().max(80, "currentStateTooLong").optional().or(z.literal("")),
  current_pincode: z.string().max(12, "currentPincodeTooLong").optional().or(z.literal("")),

  permanent_address: z.string().optional().or(z.literal("")),
  permanent_city: z.string().max(80, "permanentCityTooLong").optional().or(z.literal("")),
  permanent_state: z.string().max(80, "permanentStateTooLong").optional().or(z.literal("")),
  permanent_pincode: z.string().max(12, "permanentPincodeTooLong").optional().or(z.literal("")),

  is_same_as_permanent_address: z.boolean().optional(),
  is_commuting_from_outstation: z.boolean().optional(),
  commute_location: z.string().max(120, "commuteLocationTooLong").optional().or(z.literal("")),
  commute_notes: z.string().optional().or(z.literal("")),

  // Emergency
  emergency_contact_name: z.string().max(120, "emergencyNameTooLong").optional().or(z.literal("")),
  emergency_contact_relationship: z.string().max(50, "emergencyRelationTooLong").optional().or(z.literal("")),
  emergency_contact_phone: z.string().max(20, "emergencyPhoneTooLong").optional().or(z.literal("")),
  emergency_contact_alt_phone: z.string().max(20, "emergencyAltPhoneTooLong").optional().or(z.literal("")),

  // Academic / School internal
  admission_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "invalidDateFormat")
    .optional()
    .or(z.literal("")),
  previous_school_name: z.string().max(255, "previousSchoolTooLong").optional().or(z.literal("")),
  previous_school_class: z.string().max(50, "previousClassTooLong").optional().or(z.literal("")),
  last_school_board: z.string().max(100, "boardTooLong").optional().or(z.literal("")),
  tc_number: z.string().max(50, "tcTooLong").optional().or(z.literal("")),
  house_name: z.string().max(50, "houseTooLong").optional().or(z.literal("")),
  student_status: z.string().max(30, "statusTooLong").optional().or(z.literal("")),
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
