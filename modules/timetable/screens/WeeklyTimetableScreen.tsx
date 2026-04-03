import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { classService } from "@/modules/classes/services/classService";
import { ClassTimetableV2Panel } from "@/modules/academics/components/class/ClassTimetableV2Panel";

/**
 * Full-screen timetable for a class — uses academic backbone (TimetableVersion + TimetableEntry)
 * and the same UI as Class → Timetable tab. Legacy /api/timetable (TimetableSlot) is not used here.
 */
export default function WeeklyTimetableScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManageTimetable = hasPermission(PERMS.TIMETABLE_MANAGE);

  const [className, setClassName] = useState<string>("");

  useEffect(() => {
    if (classId) {
      classService
        .getClassDetail(classId)
        .then((c) => setClassName(`${c.name}-${c.section}`))
        .catch(() => setClassName("Class"));
    }
  }, [classId]);

  if (!classId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Class not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {className || "Timetable"}
        </Text>
      </View>
      {canManageTimetable ? (
        <Text style={styles.hint}>
          Timetable builder: bell schedule lesson periods as columns, weekdays as rows. Manage drafts, generate,
          swap slots, then activate when ready (Academics → settings for default bell & working days).
        </Text>
      ) : (
        <Text style={styles.hint}>Published timetable for this class (read-only).</Text>
      )}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <ClassTimetableV2Panel classId={classId} canManage={canManageTimetable} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  errorText: { fontSize: 16, color: Colors.error, textAlign: "center", marginBottom: Spacing.lg },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  backBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backIcon: { padding: Spacing.sm },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", color: Colors.text, marginLeft: Spacing.md },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    lineHeight: 18,
  },
  body: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
});
