// client/modules/search/types.ts
export interface StudentHit {
  id: string;
  name: string | null;
  admission_number: string | null;
  class_name: string | null;
}
export interface TeacherHit {
  id: string;
  name: string | null;
  employee_id: string | null;
}
export interface ClassHit {
  id: string;
  name: string | null;
  section: string | null;
}
export interface FeeHit {
  id: string;
  invoice_number: string | null;
  student_name: string | null;
  total_amount: number | null;
  status: string | null;
}
export interface SearchResults {
  students: StudentHit[];
  teachers: TeacherHit[];
  classes: ClassHit[];
  fees: FeeHit[];
}
