import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { attendanceV2Api } from "../../api/attendanceV2Api";
import type { AttendanceSessionV2 } from "../../types";

type Props = {
  classId: string;
  classLabel: string;
  canMark: boolean;
  canViewHistory: boolean;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const parts = dateStr.slice(0, 10).split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${parseInt(day, 10)} ${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

function statusColor(status: string): string {
  if (status === "finalized") return Colors.success ?? "#22c55e";
  return Colors.warning ?? "#f59e0b";
}

function statusLabel(status: string, ta: (key: string, opts?: object) => string): string {
  return ta(`status.${status}`, { defaultValue: status.charAt(0).toUpperCase() + status.slice(1) });
}

export function ClassAttendancePanel({ classId, classLabel, canMark, canViewHistory }: Props) {
  const { t } = useTranslation("classes");
  const { t: ta } = useTranslation("attendance");
  const router = useRouter();
  const [items, setItems] = useState<AttendanceSessionV2[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!canViewHistory) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await attendanceV2Api.getClassHistory(classId);
      setItems(r.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [classId, canViewHistory]);

  const today = new Date().toISOString().slice(0, 10);

  const openSession = (date: string) =>
    router.push({
      pathname: "/(protected)/attendance/session",
      params: { classId, className: classLabel, date },
    } as any);

  return (
    <View style={styles.root}>
      {/* Primary CTA */}
      {canMark && (
        <TouchableOpacity style={styles.cta} onPress={() => openSession(today)} activeOpacity={0.85}>
          <View style={styles.ctaIcon}>
            <Ionicons name="checkbox-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.ctaTextBlock}>
            <Text style={styles.ctaTitle}>Mark Attendance</Text>
            <Text style={styles.ctaSub}>Today · {formatDate(today)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Session history */}
      {!canViewHistory ? (
        <Text style={styles.muted}>{t("panels.classAttendance.noHistoryPermission")}</Text>
      ) : loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Recent Sessions</Text>
          <FlatList
            data={items.slice(0, 30)}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const date = item.session_date?.slice(0, 10) ?? today;
              const color = statusColor(item.status);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => openSession(date)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardDate}>{formatDate(item.session_date)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: color + "20" }]}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text style={[styles.statusText, { color }]}>
                        {statusLabel(item.status, ta)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardAction}>
                    <Text style={styles.cardActionText}>View</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No attendance records yet</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: Spacing.xs,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "12",
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTextBlock: { flex: 1 },
  ctaTitle: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  ctaSub: { fontSize: 12, color: Colors.primary + "aa", marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  loadingRow: { paddingVertical: Spacing.lg, alignItems: "center" },
  separator: { height: Spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  cardLeft: { flex: 1, gap: 6 },
  cardDate: { fontSize: 15, fontWeight: "600", color: Colors.text },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: Spacing.sm,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  muted: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
});
