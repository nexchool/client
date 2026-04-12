import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Protected } from "@/modules/permissions/components/Protected";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import { useRouter } from "expo-router";
import * as PERMS from "@/modules/permissions/constants/permissions";
import {
  useAdminAcademicDashboard,
  useTeacherTodaySchedule,
  useEligibleAttendanceClasses,
  useStudentAcademicDashboard,
} from "@/modules/academics/hooks/useAcademicQueries";

interface ActionCardProps {
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

function ActionCard({ icon, label, onPress, color }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: (color ?? Colors.primary) + "18" }]}>
        <Ionicons name={icon} size={26} color={color ?? Colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function AdminAcademicOverview() {
  const { t } = useTranslation("home");
  const { data, isLoading } = useAdminAcademicDashboard();

  if (isLoading && !data) {
    return (
      <View style={styles.strip}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const conflicts = data?.timetable_conflicts?.length ?? 0;

  return (
    <View style={styles.adminCard}>
      <Text style={styles.adminTitle}>{t("adminOverview.title")}</Text>
      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data?.total_classes ?? 0}</Text>
          <Text style={styles.statLbl}>{t("adminOverview.classes")}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data?.lectures_today ?? 0}</Text>
          <Text style={styles.statLbl}>{t("adminOverview.lecturesToday")}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data?.pending_attendance_sessions ?? 0}</Text>
          <Text style={styles.statLbl}>{t("adminOverview.pendingAtt")}</Text>
        </View>
      </View>
      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data?.classes_without_timetable ?? 0}</Text>
          <Text style={styles.statLbl}>{t("adminOverview.noTimetable")}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{data?.class_subjects_without_primary_teacher ?? 0}</Text>
          <Text style={styles.statLbl}>{t("adminOverview.subjectsDeltaTeacher")}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, conflicts > 0 && { color: Colors.warning }]}>{conflicts}</Text>
          <Text style={styles.statLbl}>{t("adminOverview.ttConflicts")}</Text>
        </View>
      </View>
    </View>
  );
}

function TeacherTodayStrip() {
  const { t } = useTranslation("home");
  const router = useRouter();
  const { data, isLoading } = useTeacherTodaySchedule();
  const today = new Date().toISOString().slice(0, 10);
  const { data: eligible = [] } = useEligibleAttendanceClasses(today);

  const next = data?.next_lecture;
  const pendingMark = eligible.length;

  return (
    <View style={styles.teacherCard}>
      <Text style={styles.teacherTitle}>{t("teacherStrip.title")}</Text>
      {isLoading && !data ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <>
          {next ? (
            <Text style={styles.teacherNext}>
              {t("teacherStrip.next", {
                className: next.class_name,
                period: next.period_number,
                subject: next.subject_name ?? "",
              })}
            </Text>
          ) : (
            <Text style={styles.mutedSm}>{t("teacherStrip.noMoreClasses")}</Text>
          )}
          <Text style={styles.mutedSm}>
            {t("teacherStrip.totalSlots", { count: data?.lectures?.length ?? 0 })}
          </Text>
          <Text style={styles.mutedSm}>
            {pendingMark === 1
              ? t("teacherStrip.eligibleOne", { count: pendingMark })
              : t("teacherStrip.eligibleMany", { count: pendingMark })}
          </Text>
          <TouchableOpacity
            style={styles.ctaRow}
            onPress={() => router.push("/(protected)/attendance/my-classes" as any)}
          >
            <Ionicons name="checkbox-outline" size={18} color={Colors.primary} />
            <Text style={styles.ctaTxt}>{t("teacherStrip.markAttendance")}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function StudentAcademicStrip() {
  const { t } = useTranslation("home");
  const { data, isLoading } = useStudentAcademicDashboard(true);

  if (isLoading && !data) {
    return (
      <View style={styles.strip}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const pct = data?.attendance_summary?.percentage ?? 0;
  const todayN = data?.today_schedule?.length ?? 0;

  return (
    <View style={styles.studentCard}>
      <Text style={styles.studentTitle}>{t("studentStrip.title")}</Text>
      <Text style={styles.mutedSm}>{t("studentStrip.classesToday", { count: todayN })}</Text>
      <Text style={styles.mutedSm}>
        {t("studentStrip.weeklySlots", { count: data?.weekly_timetable_preview?.length ?? 0 })}
      </Text>
      <Text style={styles.attPct}>{t("studentStrip.attendance", { pct })}</Text>
    </View>
  );
}

export default function ProtectedHomeScreen() {
  const { t } = useTranslation(["home", "navigation"]);
  const { user, isFeatureEnabled } = useAuth();
  const router = useRouter();
  const { role, isAdmin: adminUser, isTeacher: teacherUser, isStudent: studentUser } = useUiRole();

  const roleColor =
    role === "Admin"
      ? "#6366f1"
      : role === "Teacher"
        ? "#0ea5e9"
        : role === "Student"
          ? "#10b981"
          : "#f59e0b";

  const roleLabel = t(`navigation:roles.${role.toLowerCase()}`, { defaultValue: role });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t("home:welcomeBack")}</Text>
        <Text style={styles.nameText}>{user?.name ?? user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "18", borderColor: roleColor + "40" }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
        </View>
      </View>

      {adminUser && isFeatureEnabled("class_management") && (
        <Protected anyPermissions={[PERMS.ACADEMICS_READ, PERMS.ACADEMICS_MANAGE, PERMS.CLASS_MANAGE]}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("home:sections.academicControl")}</Text>
            <AdminAcademicOverview />
            <View style={styles.actionsGrid}>
              {isFeatureEnabled("class_management") && (
                <Protected anyPermissions={[PERMS.CLASS_READ, PERMS.CLASS_MANAGE]}>
                  <ActionCard
                    icon="library-outline"
                    label={t("home:shortcuts.classes")}
                    onPress={() => router.push("/(protected)/classes" as any)}
                    color="#6366f1"
                  />
                </Protected>
              )}
              {isFeatureEnabled("timetable") && (
                <Protected anyPermissions={[PERMS.ACADEMICS_MANAGE, PERMS.TIMETABLE_MANAGE]}>
                  <ActionCard
                    icon="alarm-outline"
                    label={t("home:shortcuts.bellSchedules")}
                    onPress={() => router.push("/(protected)/academics/bell-schedules" as any)}
                    color="#0ea5e9"
                  />
                </Protected>
              )}
              {isFeatureEnabled("attendance") && (
                <Protected permission={PERMS.ATTENDANCE_READ_ALL}>
                  <ActionCard
                    icon="stats-chart-outline"
                    label={t("home:shortcuts.attendance")}
                    onPress={() => router.push("/(protected)/attendance/overview" as any)}
                    color="#f59e0b"
                  />
                </Protected>
              )}
            </View>
          </View>
        </Protected>
      )}

      {teacherUser && !adminUser && (
        <Protected anyPermissions={[PERMS.TIMETABLE_READ, PERMS.TIMETABLE_MANAGE]}>
          {(isFeatureEnabled("timetable") || isFeatureEnabled("class_management")) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("home:sections.teachingToday")}</Text>
              <TeacherTodayStrip />
              {isFeatureEnabled("timetable") && (
                <View style={styles.actionsGrid}>
                  <ActionCard
                    icon="time-outline"
                    label={t("home:shortcuts.todaysSchedule")}
                    onPress={() => router.push("/(protected)/schedule/today" as any)}
                    color="#6366f1"
                  />
                </View>
              )}
            </View>
          )}
        </Protected>
      )}

      {!adminUser && !teacherUser && studentUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home:sections.academics")}</Text>
          <StudentAcademicStrip />
        </View>
      )}

      {adminUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home:sections.management")}</Text>
          <View style={styles.actionsGrid}>
            {isFeatureEnabled("student_management") && (
              <Protected permission={PERMS.STUDENT_CREATE}>
                <ActionCard
                  icon="person-add-outline"
                  label={t("home:shortcuts.addStudent")}
                  onPress={() =>
                    router.push({ pathname: "/(protected)/students", params: { action: "create" } })
                  }
                />
              </Protected>
            )}
            {isFeatureEnabled("teacher_management") && (
              <Protected anyPermissions={[PERMS.TEACHER_READ, PERMS.TEACHER_MANAGE]}>
                <ActionCard
                  icon="school-outline"
                  label={t("home:shortcuts.teachers")}
                  onPress={() => router.push("/(protected)/teachers" as any)}
                />
              </Protected>
            )}
            {isFeatureEnabled("student_management") && (
              <Protected anyPermissions={[PERMS.STUDENT_READ_ALL, PERMS.STUDENT_MANAGE]}>
                <ActionCard
                  icon="people-outline"
                  label={t("home:shortcuts.students")}
                  onPress={() => router.push("/(protected)/students" as any)}
                />
              </Protected>
            )}
            {isFeatureEnabled("fees_management") && (
              <Protected anyPermissions={[PERMS.FINANCE_READ, PERMS.FINANCE_MANAGE]}>
                <ActionCard
                  icon="wallet-outline"
                  label={t("home:shortcuts.finance")}
                  onPress={() => router.push("/(protected)/finance" as any)}
                  color="#10b981"
                />
              </Protected>
            )}
          </View>
        </View>
      )}

      {adminUser && isFeatureEnabled("teacher_management") && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home:sections.leaveManagement")}</Text>
          <View style={styles.actionsGrid}>
            <Protected permission={PERMS.TEACHER_LEAVE_MANAGE}>
              <ActionCard
                icon="document-text-outline"
                label={t("home:shortcuts.leaveRequests")}
                onPress={() => router.push("/(protected)/teacher-leaves" as any)}
                color="#6366f1"
              />
            </Protected>
            {isFeatureEnabled("holiday_management") && (
              <Protected anyPermissions={[PERMS.HOLIDAY_READ, PERMS.HOLIDAY_MANAGE]}>
                <ActionCard
                  icon="calendar-outline"
                  label={t("home:shortcuts.holidays")}
                  onPress={() => router.push("/(protected)/holidays" as any)}
                  color="#0ea5e9"
                />
              </Protected>
            )}
          </View>
        </View>
      )}

      {teacherUser && !adminUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home:sections.quickActions")}</Text>
          <View style={styles.actionsGrid}>
            {isFeatureEnabled("teacher_management") && (
              <Protected permission={PERMS.TEACHER_LEAVE_APPLY}>
                <ActionCard
                  icon="calendar-outline"
                  label={t("home:shortcuts.leaveTracker")}
                  onPress={() => router.push("/(protected)/my-leaves" as any)}
                  color="#f59e0b"
                />
              </Protected>
            )}
            <ActionCard
              icon="book-outline"
              label={t("home:shortcuts.academics")}
              onPress={() => router.push("/(protected)/academics" as any)}
              color="#10b981"
            />
          </View>
        </View>
      )}

      {!adminUser && !teacherUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home:sections.quickActions")}</Text>
          <View style={styles.actionsGrid}>
            {isFeatureEnabled("attendance") && (
              <Protected permission={PERMS.ATTENDANCE_READ_SELF}>
                <ActionCard
                  icon="calendar-outline"
                  label={t("home:shortcuts.myAttendance")}
                  onPress={() => router.push("/(protected)/attendance/my-attendance" as any)}
                  color="#0ea5e9"
                />
              </Protected>
            )}
            <ActionCard
              icon="book-outline"
              label={t("home:shortcuts.academics")}
              onPress={() => router.push("/(protected)/academics" as any)}
              color="#10b981"
            />
            {isFeatureEnabled("fees_management") && (
              <Protected anyPermissions={[PERMS.FEE_PAY, PERMS.FEE_READ_SELF, PERMS.FEE_READ_CHILD]}>
                <ActionCard
                  icon="wallet-outline"
                  label={t("home:shortcuts.finance")}
                  onPress={() => router.push("/(protected)/finance" as any)}
                  color="#f59e0b"
                />
              </Protected>
            )}
            <ActionCard
              icon="person-outline"
              label={t("home:shortcuts.profile")}
              onPress={() => router.push("/(protected)/profile" as any)}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },

  header: { alignItems: "center", marginBottom: Spacing.xl, gap: Spacing.sm },
  welcomeText: { fontSize: 14, color: Colors.textSecondary },
  nameText: { fontSize: 22, fontWeight: "700", color: Colors.text, textAlign: "center" },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 2,
  },
  roleText: { fontSize: 13, fontWeight: "600" },

  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  actionCard: {
    width: "47%",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
  },

  adminCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  adminTitle: { fontSize: 15, fontWeight: "700", marginBottom: Spacing.sm },
  statRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800", color: Colors.text },
  statLbl: { fontSize: 10, color: Colors.textSecondary, textAlign: "center" },

  teacherCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
    gap: 4,
  },
  teacherTitle: { fontSize: 15, fontWeight: "700" },
  teacherNext: { fontSize: 14, fontWeight: "600", color: Colors.text },
  mutedSm: { fontSize: 13, color: Colors.textSecondary },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.sm },
  ctaTxt: { fontSize: 14, fontWeight: "700", color: Colors.primary },

  studentCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  studentTitle: { fontSize: 15, fontWeight: "700" },
  attPct: { fontSize: 18, fontWeight: "800", color: Colors.primary, marginTop: Spacing.xs },

  strip: { padding: Spacing.lg, alignItems: "center" },
});
