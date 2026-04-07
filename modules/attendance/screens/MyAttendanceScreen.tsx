import React from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { useMyAttendanceV2 } from "@/modules/academics/hooks/useAcademicQueries";

export default function MyAttendanceScreen() {
  const { t } = useTranslation("attendance");
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching, error } = useMyAttendanceV2(undefined);

  const records = data?.records ?? [];
  const percentage = data?.percentage ?? 0;
  const present = data?.present ?? 0;
  const totalDays = data?.total_days ?? 0;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;

  const percentageColor =
    percentage >= 75 ? Colors.success : percentage >= 50 ? Colors.warning : Colors.error;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return Colors.success;
      case "absent":
        return Colors.error;
      case "late":
        return Colors.warning;
      default:
        return Colors.textTertiary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "checkmark-circle" as const;
      case "absent":
        return "close-circle" as const;
      case "late":
        return "time" as const;
      default:
        return "ellipse-outline" as const;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("myAttendance.title")}</Text>
      </View>

      {isLoading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{(error as Error).message}</Text>
        </View>
      ) : (
        <>
          {data && (
            <View style={styles.summaryCard}>
              <View style={styles.percentageCircle}>
                <Text style={[styles.percentageText, { color: percentageColor }]}>{percentage}%</Text>
                <Text style={styles.percentageLabel}>{t("myAttendance.attendanceLabel")}</Text>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.summaryRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.summaryText}>{t("myAttendance.presentCount", { count: present })}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.summaryText}>{t("myAttendance.absentCount", { count: absent })}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="time" size={18} color={Colors.warning} />
                  <Text style={styles.summaryText}>{t("myAttendance.lateCount", { count: late })}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                  <Text style={styles.summaryText}>{t("myAttendance.totalDays", { count: totalDays })}</Text>
                </View>
              </View>
            </View>
          )}

          <FlatList
            data={records}
            keyExtractor={(item) => `${item.date}-${item.session_id}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
            }
            renderItem={({ item }) => (
              <View style={styles.recordRow}>
                <Ionicons name={getStatusIcon(item.status)} size={22} color={getStatusColor(item.status)} />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordDate}>{item.date}</Text>
                  {item.remarks ? <Text style={styles.recordRemarks}>{item.remarks}</Text> : null}
                </View>
                <Text style={[styles.recordStatus, { color: getStatusColor(item.status) }]}>
                  {t(`status.${item.status}`, { defaultValue: item.status })}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>{t("myAttendance.emptyRecords")}</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backIcon: { padding: Spacing.sm },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "bold", color: Colors.text, marginLeft: Spacing.md },
  summaryCard: {
    flexDirection: "row",
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    alignItems: "center",
  },
  percentageCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  percentageText: { fontSize: 22, fontWeight: "700" },
  percentageLabel: { fontSize: 11, color: Colors.textSecondary },
  summaryStats: { flex: 1, gap: Spacing.sm },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  summaryText: { fontSize: 14, color: Colors.text },
  listContent: { padding: Spacing.md },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  recordInfo: { flex: 1 },
  recordDate: { fontSize: 15, fontWeight: "500", color: Colors.text },
  recordRemarks: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  recordStatus: { fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
});
