export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectDTO {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateSubjectDTO {
  name?: string;
  code?: string;
  description?: string;
}

export interface MySubjectTeacher {
  teacher_id: string;
  teacher_name: string;
  role: string;
}

export interface MySubjectClass {
  class_id: string;
  class_name: string;
  is_mandatory: boolean;
  weekly_periods: number;
  teachers: MySubjectTeacher[];
}

export interface MySubject {
  id: string;
  name: string;
  code: string | null;
  subject_type: string;
  description: string | null;
  classes: MySubjectClass[];
}
