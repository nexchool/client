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
import enTeacherLeaves from "./resources/en/teacherLeaves.json";
import enFinance from "./resources/en/finance.json";
import enHolidays from "./resources/en/holidays.json";
import enNotifications from "./resources/en/notifications.json";
import enSchedule from "./resources/en/schedule.json";
import enTimetable from "./resources/en/timetable.json";
import enTransport from "./resources/en/transport.json";
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
import guTeacherLeaves from "./resources/gu/teacherLeaves.json";
import guFinance from "./resources/gu/finance.json";
import guHolidays from "./resources/gu/holidays.json";
import guNotifications from "./resources/gu/notifications.json";
import guSchedule from "./resources/gu/schedule.json";
import guTimetable from "./resources/gu/timetable.json";
import guTransport from "./resources/gu/transport.json";
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
import hiTeacherLeaves from "./resources/hi/teacherLeaves.json";
import hiFinance from "./resources/hi/finance.json";
import hiHolidays from "./resources/hi/holidays.json";
import hiNotifications from "./resources/hi/notifications.json";
import hiSchedule from "./resources/hi/schedule.json";
import hiTimetable from "./resources/hi/timetable.json";
import hiTransport from "./resources/hi/transport.json";

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
  "teacherLeaves",
  "finance",
  "holidays",
  "notifications",
  "schedule",
  "timetable",
  "transport",
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
    teacherLeaves: enTeacherLeaves,
    finance: enFinance,
    holidays: enHolidays,
    notifications: enNotifications,
    schedule: enSchedule,
    timetable: enTimetable,
    transport: enTransport,
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
    teacherLeaves: guTeacherLeaves,
    finance: guFinance,
    holidays: guHolidays,
    notifications: guNotifications,
    schedule: guSchedule,
    timetable: guTimetable,
    transport: guTransport,
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
    teacherLeaves: hiTeacherLeaves,
    finance: hiFinance,
    holidays: hiHolidays,
    notifications: hiNotifications,
    schedule: hiSchedule,
    timetable: hiTimetable,
    transport: hiTransport,
  },
} as const;
