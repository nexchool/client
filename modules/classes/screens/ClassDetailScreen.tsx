import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useClasses } from "../hooks/useClasses";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { ClassActiveTimetablePanel } from "@/modules/academics/components/class/ClassActiveTimetablePanel";
import { ClassAttendancePanel } from "@/modules/academics/components/class/ClassAttendancePanel";

type HubTab = "students" | "timetable" | "attendance";

const TABS: { key: HubTab; label: string }[] = [
  { key: "students", label: "Students" },
  { key: "timetable", label: "Timetable" },
  { key: "attendance", label: "Attendance" },
];

export default function ClassDetailScreen() {
  const { t } = useTranslation("classes");
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

  const visibleTabs = useMemo(() => {
    return TABS.filter((tab) => {
      if (tab.key === "timetable") return canTimetable;
      if (tab.key === "attendance") return canAttendanceView;
      return true;
    });
  }, [canTimetable, canAttendanceView]);

  const [tab, setTab] = useState<HubTab>("students");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) fetchClassDetail(id);
  }, [id]);

  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) {
      setTab(visibleTabs[0]?.key ?? "students");
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

  if (loading && !currentClass) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentClass) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t("detail.notFound")}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{t("detail.goBack")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const classLabel = `${currentClass.name}-${currentClass.section}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>{classLabel}</Text>
          <Text style={styles.headerSub}>{currentClass.academic_year}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Class teacher + grade level info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Class Teacher</Text>
            <Text style={styles.infoValue}>
              {currentClass.teacher_name || "—"}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentClass.student_count || 0}</Text>
            <Text style={styles.statLabel}>{t("detail.students")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentClass.teacher_count || 0}</Text>
            <Text style={styles.statLabel}>{t("detail.teachers")}</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {visibleTabs.map((tabDef) => (
            <TouchableOpacity
              key={tabDef.key}
              style={[styles.tabChip, tab === tabDef.key && styles.tabChipActive]}
              onPress={() => setTab(tabDef.key)}
            >
              <Text style={[styles.tabChipTxt, tab === tabDef.key && styles.tabChipTxtActive]}>
                {tabDef.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabBody}>
          {tab === "students" && (
            <View>
              {currentClass.students && currentClass.students.length > 0 ? (
                currentClass.students.map((student) => (
                  <View key={student.id} style={styles.listItem}>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{student.name}</Text>
                      <Text style={styles.listItemDetail}>{student.admission_number}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{t("detail.noStudents")}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backIcon: { padding: Spacing.sm, marginRight: Spacing.sm },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  content: { flex: 1 },
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tabChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
  },
  tabChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "18",
  },
  tabChipTxt: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  tabChipTxtActive: { color: Colors.primary },
  tabBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.lg,
    minHeight: 400,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  listItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  listItemInfo: { flex: 1 },
  listItemName: { fontSize: 15, fontWeight: "500", color: Colors.text },
  listItemDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic", marginTop: Spacing.lg },
  errorText: { fontSize: 16, color: Colors.error, textAlign: "center", marginBottom: Spacing.lg },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  backBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
