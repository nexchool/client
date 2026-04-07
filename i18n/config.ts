import enCommon from "./resources/en/common.json";
import enAuth from "./resources/en/auth.json";
import enSettings from "./resources/en/settings.json";
import enNavigation from "./resources/en/navigation.json";
import enHome from "./resources/en/home.json";
import enProfile from "./resources/en/profile.json";
import enStudents from "./resources/en/students.json";
import enTeachers from "./resources/en/teachers.json";
import enClasses from "./resources/en/classes.json";
import enSubjects from "./resources/en/subjects.json";
import guCommon from "./resources/gu/common.json";
import guAuth from "./resources/gu/auth.json";
import guSettings from "./resources/gu/settings.json";
import guNavigation from "./resources/gu/navigation.json";
import guHome from "./resources/gu/home.json";
import guProfile from "./resources/gu/profile.json";
import guStudents from "./resources/gu/students.json";
import guTeachers from "./resources/gu/teachers.json";
import guClasses from "./resources/gu/classes.json";
import guSubjects from "./resources/gu/subjects.json";

export const LANGUAGE_STORAGE_KEY = "@school_erp_app_language";

export const SUPPORTED_LANGUAGES = ["en", "gu"] as const;
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
  "teachers",
  "classes",
  "subjects",
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
    teachers: enTeachers,
    classes: enClasses,
    subjects: enSubjects,
  },
  gu: {
    common: guCommon,
    auth: guAuth,
    settings: guSettings,
    navigation: guNavigation,
    home: guHome,
    profile: guProfile,
    students: guStudents,
    teachers: guTeachers,
    classes: guClasses,
    subjects: guSubjects,
  },
} as const;
