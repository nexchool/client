import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import type { Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
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

function statusColorKey(status: string): keyof Palette {
  if (status === "finalized") return "success";
  return "warning";
}

function statusLabel(status: string, ta: TFunction): string {
  return ta(`status.${status}`, { defaultValue: status.charAt(0).toUpperCase() + status.slice(1) });
}

export function ClassAttendancePanel({ classId, classLabel, canMark, canViewHistory }: Props) {
  const { t } = useTranslation("classes");
  const { t: ta } = useTranslation("attendance");
  const { palette, spacing, radius } = useTheme();
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
    <View style={{ paddingTop: spacing.xs }}>
      {/* Primary CTA */}
      {canMark && (
        <PressScale
          style={[
            styles.cta,
            {
              backgroundColor: palette.primaryContainer,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.lg,
              gap: spacing.sm,
            },
          ]}
          onPress={() => openSession(today)}
        >
          <View style={[styles.ctaIcon, { backgroundColor: palette.primary, borderRadius: radius.full }]}>
            <AppIcon name="checkbox-outline" size="lg" color="onPrimary" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="labelLg" color="onPrimaryContainer">{t("panels.classAttendance.markTitle", { defaultValue: "Mark Attendance" })}</Text>
            <Text variant="labelSm" color="onPrimaryContainer" style={{ marginTop: 2 }}>
              {t("panels.classAttendance.todayPrefix", { defaultValue: "Today" })} · {formatDate(today)}
            </Text>
          </View>
          <AppIcon name="chevron-forward" size="md" color="onPrimaryContainer" />
        </PressScale>
      )}

      {/* Session history */}
      {!canViewHistory ? (
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ fontStyle: "italic" }}>
          {t("panels.classAttendance.noHistoryPermission")}
        </Text>
      ) : loading ? (
        <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <>
          <Text variant="overline" color="onSurfaceVariant" style={{ marginBottom: spacing.sm }}>
            {t("panels.classAttendance.recentSessions", { defaultValue: "Recent Sessions" })}
          </Text>
          <FlatList
            data={items.slice(0, 30)}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => {
              const date = item.session_date?.slice(0, 10) ?? today;
              const colorKey = statusColorKey(item.status);
              const color = palette[colorKey];
              return (
                <PressScale
                  style={[
                    styles.card,
                    {
                      backgroundColor: palette.surfaceContainerLowest,
                      borderColor: palette.surfaceContainerHighest,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                    },
                  ]}
                  onPress={() => openSession(date)}
                >
                  <View style={styles.cardLeft}>
                    <Text variant="labelLg" color="onSurface">{formatDate(item.session_date)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: color + "20" }]}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text variant="labelSm" style={{ color }}>
                        {statusLabel(item.status, ta)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardAction}>
                    <Text variant="labelMd" color="primary">{t("panels.classAttendance.view", { defaultValue: "View" })}</Text>
                    <AppIcon name="chevron-forward" size="sm" color="primary" />
                  </View>
                </PressScale>
              );
            }}
            ListEmptyComponent={
              <View style={[styles.emptyState, { paddingVertical: spacing.xl * 2, gap: spacing.sm }]}>
                <AppIcon name="document-outline" size="xl" color="outline" />
                <Text variant="labelLg" color="onSurfaceVariant">
                  {t("panels.classAttendance.emptyTitle", { defaultValue: "No attendance records yet" })}
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: { flexDirection: "row", alignItems: "center" },
  ctaIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  cardLeft: { flex: 1, gap: 6 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  cardAction: { flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 8 },
  emptyState: { alignItems: "center" },
});
