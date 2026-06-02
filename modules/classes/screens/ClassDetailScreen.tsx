import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { DetailTabs, type TabItem } from "@/common/components/DetailTabs";
import { useClasses } from "../hooks/useClasses";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { ClassActiveTimetablePanel } from "@/modules/academics/components/class/ClassActiveTimetablePanel";
import { ClassAttendancePanel } from "@/modules/academics/components/class/ClassAttendancePanel";
import { ClassTeachersPanel } from "@/modules/academics/components/class/ClassTeachersPanel";
import { SubjectTeachersPanel } from "@/modules/academics/components/class/SubjectTeachersPanel";
import { ClassSubjectsReadOnlyPanel } from "@/modules/classes/components/ClassSubjectsReadOnlyPanel";

type HubTab = "students" | "teachers" | "subjects" | "timetable" | "attendance";

export default function ClassDetailScreen() {
  const { t } = useTranslation("classes");
  const { palette, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFeatureEnabled } = useAuth();
  const { currentClass, loading, fetchClassDetail } = useClasses();
  const { hasPermission } = usePermissions();

  const canTimetable =
    isFeatureEnabled("timetable") &&
    (hasPermission(PERMS.TIMETABLE_READ) || hasPermission(PERMS.TIMETABLE_MANAGE));
  const canAttendanceMark =
    isFeatureEnabled("attendance") && hasPermission(PERMS.ATTENDANCE_MARK);
  const canAttendanceView =
    isFeatureEnabled("attendance") &&
    (hasPermission(PERMS.ATTENDANCE_READ_CLASS) ||
      hasPermission(PERMS.ATTENDANCE_READ_ALL) ||
      canAttendanceMark);

  const canManageClassTeachers = hasPermission(PERMS.CLASS_TEACHER_MANAGE);
  const canViewTeachers = canManageClassTeachers || hasPermission(PERMS.TEACHER_READ);
  const canManageSubjectTeachers = hasPermission(PERMS.CLASS_SUBJECT_MANAGE);
  const canViewSubjects = hasPermission(PERMS.CLASS_SUBJECT_READ) || canManageSubjectTeachers;

  const visibleTabs = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [{ key: "students", label: t("detail.students") }];
    if (canViewTeachers) items.push({ key: "teachers", label: t("detail.teachers") });
    if (canViewSubjects) items.push({ key: "subjects", label: t("detail.subjects", { defaultValue: "Subjects" }) });
    if (canTimetable) items.push({ key: "timetable", label: t("detail.timetable") });
    if (canAttendanceView) items.push({ key: "attendance", label: t("detail.attendance") });
    return items;
  }, [canViewTeachers, canViewSubjects, canTimetable, canAttendanceView, t]);

  const [tab, setTab] = useState<HubTab>("students");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) fetchClassDetail(id);
  }, [id]);

  useEffect(() => {
    if (!visibleTabs.some((vt) => vt.key === tab)) {
      setTab((visibleTabs[0]?.key as HubTab) ?? "students");
    }
  }, [visibleTabs, tab]);

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await fetchClassDetail(id);
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        { paddingHorizontal: spacing.marginMobile, paddingVertical: spacing.md, borderBottomColor: palette.surfaceContainerHighest },
      ]}
    >
      <AppIcon name="arrow-back" size="lg" color="onSurface" onPress={() => router.back()} accessibilityLabel={t("detail.goBack")} />
      <View style={{ flex: 1 }}>
        {currentClass ? (
          <>
            <Text variant="headlineMd" color="onSurface">{`${currentClass.name}-${currentClass.section}`}</Text>
            <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing[2] }}>
              {currentClass.academic_year}
            </Text>
          </>
        ) : (
          <Text variant="headlineMd" color="onSurface">{t("detail.title", { defaultValue: "" })}</Text>
        )}
      </View>
    </View>
  );

  if (loading && !currentClass) {
    return (
      <View style={[styles.container, { backgroundColor: palette.surface }]}>
        {renderHeader()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  if (!currentClass) {
    return (
      <View style={[styles.container, { backgroundColor: palette.surface }]}>
        {renderHeader()}
        <View style={[styles.center, { padding: spacing.xl }]}>
          <Text variant="bodyLg" color="error" style={{ marginBottom: spacing.lg, textAlign: "center" }}>
            {t("detail.notFound")}
          </Text>
          <PressScale
            onPress={() => router.back()}
            style={{
              backgroundColor: palette.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: radius.md,
            }}
          >
            <Text variant="labelLg" color="onPrimary">{t("detail.goBack")}</Text>
          </PressScale>
        </View>
      </View>
    );
  }

  const classLabel = `${currentClass.name}-${currentClass.section}`;

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      {renderHeader()}

      <ScrollView
        style={{ flex: 1 }}
        nestedScrollEnabled
        contentContainerStyle={{ paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl + spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* Class teacher info */}
        <View style={{ paddingTop: spacing.md }}>
          <Text variant="overline" color="onSurfaceVariant">{t("detail.classTeacher", { defaultValue: "Class Teacher" })}</Text>
          <Text variant="labelLg" color="onSurface" style={{ marginTop: spacing[2] }}>
            {currentClass.teacher_name || "—"}
          </Text>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { paddingTop: spacing.lg, gap: spacing.md }]}>
          <View style={[styles.statCard, { backgroundColor: palette.surfaceContainerLow, padding: spacing.md, borderRadius: radius.md }]}>
            <Text variant="headlineLg" color="onSurface">{currentClass.student_count || 0}</Text>
            <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing[2] }}>{t("detail.students")}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.surfaceContainerLow, padding: spacing.md, borderRadius: radius.md }]}>
            <Text variant="headlineLg" color="onSurface">{currentClass.teacher_count || 0}</Text>
            <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing[2] }}>{t("detail.teachers")}</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={{ marginTop: spacing.lg }}>
          <DetailTabs tabs={visibleTabs} active={tab} onChange={(key) => setTab(key as HubTab)} />
        </View>

        {/* Tab content */}
        <View style={{ minHeight: 400 }}>
          {tab === "students" && (
            <View>
              {currentClass.students && currentClass.students.length > 0 ? (
                currentClass.students.map((student) => (
                  <View key={student.id} style={[styles.listItem, { paddingVertical: spacing.md, borderBottomColor: palette.surfaceContainerHighest }]}>
                    <Text variant="labelLg" color="onSurface">{student.name}</Text>
                    <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: spacing[2] }}>
                      {student.admission_number}
                    </Text>
                  </View>
                ))
              ) : (
                <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.lg, fontStyle: "italic" }}>
                  {t("detail.noStudents")}
                </Text>
              )}
            </View>
          )}

          {tab === "teachers" && id && (
            <View style={{ paddingTop: spacing.md }}>
              <ClassTeachersPanel classId={id} canManage={canManageClassTeachers} />
            </View>
          )}

          {tab === "subjects" && id && (
            <View style={{ paddingTop: spacing.md }}>
              <ClassSubjectsReadOnlyPanel classId={id} />
              {canManageSubjectTeachers && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text variant="overline" color="onSurfaceVariant" style={{ marginBottom: spacing.sm }}>
                    {t("detail.subjectTeachers", { defaultValue: "Subject Teachers" })}
                  </Text>
                  <SubjectTeachersPanel classId={id} canManage={canManageSubjectTeachers} />
                </View>
              )}
            </View>
          )}

          {tab === "timetable" && id && <ClassActiveTimetablePanel classId={id} />}

          {tab === "attendance" && id && (
            <ClassAttendancePanel
              classId={id}
              classLabel={classLabel}
              canMark={canAttendanceMark}
              canViewHistory={canAttendanceView}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
  },
  statsRow: { flexDirection: "row" },
  statCard: { flex: 1, alignItems: "center" },
  listItem: { borderBottomWidth: 1 },
});
