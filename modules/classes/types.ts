import { Student } from "@/modules/students/types";
import { Teacher } from "@/modules/teachers/types";

export interface ClassItem {
  id: string;
  name: string;
  section: string;
  /** Standard / grade number when using standard-based naming (e.g. 10 → Grade 10) */
  grade_level?: number | null;
  academic_year: string;
  academic_year_id?: string;
  start_date?: string;
  end_date?: string;
  teacher_id?: string;
  teacher_name?: string;
  student_count?: number;
  teacher_count?: number;
  created_at: string;
}

export interface ClassTeacherAssignment {
  id: string;
  class_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_employee_id: string;
  subject?: string;
  subject_id?: string;
  subject_name?: string;
  is_class_teacher: boolean;
  created_at: string;
}

export interface ClassDetail extends ClassItem {
  students: Student[];
  teachers: ClassTeacherAssignment[];
}

export interface CreateClassDTO {
  /** Set when not using grade_level — server derives name as `Grade {grade_level}` when grade_level is set */
  name?: string;
  section: string;
  academic_year_id: string;
  grade_level?: number;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
}

// --- Subject Load ---
export interface SubjectLoad {
  id: string;
  class_id: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  weekly_periods: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectLoadDTO {
  subject_id: string;
  weekly_periods: number;
}
