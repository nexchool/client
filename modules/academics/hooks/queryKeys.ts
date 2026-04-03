export const qk = {
  classSubjects: (classId: string) => ["academics", "classSubjects", classId] as const,
  subjectTeachers: (classId: string) => ["academics", "subjectTeachers", classId] as const,
  classTeachers: (classId: string) => ["academics", "classTeachers", classId] as const,
  timetableVersions: (classId: string) => ["academics", "timetableVersions", classId] as const,
  timetableBundle: (classId: string, versionId: string | null | undefined) =>
    ["academics", "timetable", classId, versionId ?? "active"] as const,
  bellSchedules: () => ["academics", "bellSchedules"] as const,
  bellSchedule: (id: string) => ["academics", "bellSchedule", id] as const,
  academicSettings: () => ["academics", "settings"] as const,
  adminDashboard: () => ["academics", "adminDashboard"] as const,
  academicHealth: () => ["academics", "health"] as const,
  teacherToday: () => ["academics", "teacherToday"] as const,
  studentDashboard: () => ["academics", "studentDashboard"] as const,
  eligibleClasses: (date: string) => ["attendance", "eligible", date] as const,
  classSession: (classId: string, date: string) => ["attendance", "session", classId, date] as const,
  classAttendanceHistory: (classId: string) => ["attendance", "history", classId] as const,
  myAttendanceV2: (month: string | undefined) => ["attendance", "meV2", month ?? "all"] as const,
};
