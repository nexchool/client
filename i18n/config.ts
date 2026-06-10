import enCommon from "./resources/en/common.json";
import enAuth from "./resources/en/auth.json";
import enSettings from "./resources/en/settings.json";
import enNavigation from "./resources/en/navigation.json";
import enHome from "./resources/en/home.json";
import enProfile from "./resources/en/profile.json";
import enStudents from "./resources/en/students.json";
import enStudentLeaves from "./resources/en/studentLeaves.json";
import enTeachers from "./resources/en/teachers.json";
import enClasses from "./resources/en/classes.json";
import enAttendance from "./resources/en/attendance.json";
import enAnnouncements from "./resources/en/announcements.json";
import enTeacherLeaves from "./resources/en/teacherLeaves.json";
import enFinance from "./resources/en/finance.json";
import enHolidays from "./resources/en/holidays.json";
import enNotifications from "./resources/en/notifications.json";
import enSchedule from "./resources/en/schedule.json";
import enSearch from "./resources/en/search.json";
import enTimetable from "./resources/en/timetable.json";
import enTransport from "./resources/en/transport.json";
import enHostel from "./resources/en/hostel.json";
import enSubjects from "./resources/en/subjects.json";
import enAudit from "./resources/en/audit.json";
import guCommon from "./resources/gu/common.json";
import guAuth from "./resources/gu/auth.json";
import guSettings from "./resources/gu/settings.json";
import guNavigation from "./resources/gu/navigation.json";
import guHome from "./resources/gu/home.json";
import guProfile from "./resources/gu/profile.json";
import guStudents from "./resources/gu/students.json";
import guStudentLeaves from "./resources/gu/studentLeaves.json";
import guTeachers from "./resources/gu/teachers.json";
import guClasses from "./resources/gu/classes.json";
import guAttendance from "./resources/gu/attendance.json";
import guAnnouncements from "./resources/gu/announcements.json";
import guTeacherLeaves from "./resources/gu/teacherLeaves.json";
import guFinance from "./resources/gu/finance.json";
import guHolidays from "./resources/gu/holidays.json";
import guNotifications from "./resources/gu/notifications.json";
import guSchedule from "./resources/gu/schedule.json";
import guSearch from "./resources/gu/search.json";
import guTimetable from "./resources/gu/timetable.json";
import guTransport from "./resources/gu/transport.json";
import guHostel from "./resources/gu/hostel.json";
import guSubjects from "./resources/gu/subjects.json";
import guAudit from "./resources/gu/audit.json";
import hiCommon from "./resources/hi/common.json";
import hiAuth from "./resources/hi/auth.json";
import hiSettings from "./resources/hi/settings.json";
import hiNavigation from "./resources/hi/navigation.json";
import hiHome from "./resources/hi/home.json";
import hiProfile from "./resources/hi/profile.json";
import hiStudents from "./resources/hi/students.json";
import hiStudentLeaves from "./resources/hi/studentLeaves.json";
import hiTeachers from "./resources/hi/teachers.json";
import hiClasses from "./resources/hi/classes.json";
import hiAttendance from "./resources/hi/attendance.json";
import hiAnnouncements from "./resources/hi/announcements.json";
import hiTeacherLeaves from "./resources/hi/teacherLeaves.json";
import hiFinance from "./resources/hi/finance.json";
import hiHolidays from "./resources/hi/holidays.json";
import hiNotifications from "./resources/hi/notifications.json";
import hiSchedule from "./resources/hi/schedule.json";
import hiSearch from "./resources/hi/search.json";
import hiTimetable from "./resources/hi/timetable.json";
import hiTransport from "./resources/hi/transport.json";
import hiHostel from "./resources/hi/hostel.json";
import hiSubjects from "./resources/hi/subjects.json";
import hiAudit from "./resources/hi/audit.json";

export const LANGUAGE_STORAGE_KEY = "@school_erp_app_language";

export const SUPPORTED_LANGUAGES = ["en", "gu", "hi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const isSupportedLanguage = (code: string): code is SupportedLanguage =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(code);

export const I18N_NAMESPACES = [
  "common",
  "auth",
  "settings",
  "navigation",
  "home",
  "profile",
  "students",
  "studentLeaves",
  "teachers",
  "classes",
  "attendance",
  "announcements",
  "teacherLeaves",
  "finance",
  "holidays",
  "notifications",
  "schedule",
  "search",
  "timetable",
  "transport",
  "hostel",
  "subjects",
  "audit",
] as const;
export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    settings: enSettings,
    navigation: enNavigation,
    home: enHome,
    profile: enProfile,
    students: enStudents,
    studentLeaves: enStudentLeaves,
    teachers: enTeachers,
    classes: enClasses,
    attendance: enAttendance,
    announcements: enAnnouncements,
    teacherLeaves: enTeacherLeaves,
    finance: enFinance,
    holidays: enHolidays,
    notifications: enNotifications,
    schedule: enSchedule,
    search: enSearch,
    timetable: enTimetable,
    transport: enTransport,
    hostel: enHostel,
    subjects: enSubjects,
    audit: enAudit,
  },
  gu: {
    common: guCommon,
    auth: guAuth,
    settings: guSettings,
    navigation: guNavigation,
    home: guHome,
    profile: guProfile,
    students: guStudents,
    studentLeaves: guStudentLeaves,
    teachers: guTeachers,
    classes: guClasses,
    attendance: guAttendance,
    announcements: guAnnouncements,
    teacherLeaves: guTeacherLeaves,
    finance: guFinance,
    holidays: guHolidays,
    notifications: guNotifications,
    schedule: guSchedule,
    search: guSearch,
    timetable: guTimetable,
    transport: guTransport,
    hostel: guHostel,
    subjects: guSubjects,
    audit: guAudit,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    settings: hiSettings,
    navigation: hiNavigation,
    home: hiHome,
    profile: hiProfile,
    students: hiStudents,
    studentLeaves: hiStudentLeaves,
    teachers: hiTeachers,
    classes: hiClasses,
    attendance: hiAttendance,
    announcements: hiAnnouncements,
    teacherLeaves: hiTeacherLeaves,
    finance: hiFinance,
    holidays: hiHolidays,
    notifications: hiNotifications,
    schedule: hiSchedule,
    search: hiSearch,
    timetable: hiTimetable,
    transport: hiTransport,
    hostel: hiHostel,
    subjects: hiSubjects,
    audit: hiAudit,
  },
} as const;
