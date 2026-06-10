import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { classAcademicApi } from "../../api/classAcademicApi";
import type { BellSchedulePeriod, TimetableEntryV2 } from "../../types";

type Props = { classId: string };

const DOW_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function fmtTime(iso?: string | null): string {
  if (!iso) return "";
  return iso.includes("T") ? (iso.split("T")[1]?.slice(0, 5) ?? "") : iso.slice(0, 5);
}

function derivePeriodsFromEntries(entries: TimetableEntryV2[]): BellSchedulePeriod[] {
  const nums = [...new Set(entries.map((e) => e.period_number))].sort((a, b) => a - b);
  return nums.map((n) => ({
    id: `p-${n}`,
    bell_schedule_id: "",
    period_number: n,
    period_kind: "lesson",
    starts_at: null,
    ends_at: null,
    label: `P${n}`,
    sort_order: n,
  }));
}

export function ClassActiveTimetablePanel({ classId }: Props) {
  const { t } = useTranslation("classes");
  const { palette, spacing, radius } = useTheme();
  const [entries, setEntries] = useState<TimetableEntryV2[]>([]);
  const [lessonPeriods, setLessonPeriods] = useState<BellSchedulePeriod[]>([]);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [scheduleName, setScheduleName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActive, setHasActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await classAcademicApi.listTimetableVersions(classId);
      const active = items.find((v) => v.status === "active");
      if (!active) {
        setHasActive(false);
        setEntries([]);
        setLessonPeriods([]);
        setLoading(false);
        return;
      }
      setHasActive(true);
      const bundle = await classAcademicApi.getTimetable(classId, active.id);
      const bundleEntries = bundle.items ?? [];
      setEntries(bundleEntries);
      const wd = bundle.working_days?.length ? bundle.working_days : [1, 2, 3, 4, 5, 6];
      setWorkingDays(wd);
      if (bundle.bell_schedule?.lesson_periods?.length) {
        setLessonPeriods(bundle.bell_schedule.lesson_periods);
        setScheduleName(bundle.bell_schedule.name ?? null);
      } else {
        setLessonPeriods(derivePeriodsFromEntries(bundleEntries));
        setScheduleName(null);
      }
    } catch {
      setHasActive(false);
      setEntries([]);
      setLessonPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  const cellMap = useMemo(() => {
    const m = new Map<string, TimetableEntryV2>();
    entries.forEach((e) => m.set(`${e.day_of_week}-${e.period_number}`, e));
    return m;
  }, [entries]);

  if (loading) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!hasActive || lessonPeriods.length === 0) {
    return (
      <View style={[styles.emptyState, { paddingVertical: spacing.xl * 2, gap: spacing.sm }]}>
        <AppIcon name="calendar-outline" size="xl" color="outline" />
        <Text variant="labelLg" color="onSurfaceVariant">
          {t("panels.activeTimetable.emptyTitle", { defaultValue: "No timetable available" })}
        </Text>
        <Text variant="bodySm" color="onSurfaceVariant" style={{ textAlign: "center" }}>
          {t("panels.activeTimetable.emptyHint", { defaultValue: "The active timetable will appear here once published." })}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ marginBottom: spacing.md }}>
        <Text variant="headlineMd" color="onSurface">
          {t("panels.activeTimetable.title", { defaultValue: "Timetable" })}
        </Text>
        {scheduleName ? (
          <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: 2 }}>{scheduleName}</Text>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Column headers */}
          <View style={[styles.gridHeaderRow, { borderBottomColor: palette.surfaceContainerHighest }]}>
            <View style={styles.dayLabelCell} />
            {lessonPeriods.map((lp) => (
              <View key={lp.period_number} style={[styles.periodHeaderCell, { borderLeftColor: palette.surfaceContainerHighest }]}>
                <Text variant="labelSm" color="onSurfaceVariant" style={{ textAlign: "center" }} numberOfLines={1}>
                  {lp.label || `P${lp.period_number}`}
                </Text>
                {(lp.starts_at || lp.ends_at) ? (
                  <Text variant="labelSm" color="onSurfaceVariant" style={{ textAlign: "center", marginTop: 1 }}>
                    {fmtTime(lp.starts_at)}
                    {lp.starts_at && lp.ends_at ? "–" : ""}
                    {fmtTime(lp.ends_at)}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* Rows per working day */}
          {workingDays.map((dow) => (
            <View key={dow} style={[styles.gridRow, { borderBottomColor: palette.surfaceContainerHighest }]}>
              <View style={styles.dayLabelCell}>
                <Text variant="labelSm" color="onSurfaceVariant" style={{ textAlign: "center" }}>
                  {DOW_LABELS[dow] ?? `D${dow}`}
                </Text>
              </View>
              {lessonPeriods.map((lp) => {
                const entry = cellMap.get(`${dow}-${lp.period_number}`);
                return (
                  <View
                    key={lp.period_number}
                    style={[
                      styles.cell,
                      { borderLeftColor: palette.surfaceContainerHighest },
                      !entry && { backgroundColor: palette.surfaceContainerLow },
                    ]}
                  >
                    {entry ? (
                      <>
                        <Text variant="labelSm" color="onSurface" numberOfLines={2}>
                          {entry.subject_name ?? "—"}
                        </Text>
                        {entry.teacher_name ? (
                          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 3 }}>
                            {entry.teacher_name}
                          </Text>
                        ) : null}
                        {entry.room ? (
                          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 1 }}>
                            {entry.room}
                          </Text>
                        ) : null}
                      </>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const CELL_WIDTH = 100;
const DAY_WIDTH = 40;

const styles = StyleSheet.create({
  emptyState: { alignItems: "center" },
  gridHeaderRow: { flexDirection: "row", borderBottomWidth: 1, marginBottom: 2 },
  dayLabelCell: { width: DAY_WIDTH, justifyContent: "center", alignItems: "center", paddingVertical: 4 },
  periodHeaderCell: {
    width: CELL_WIDTH,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderLeftWidth: 1,
  },
  gridRow: { flexDirection: "row", borderBottomWidth: 1 },
  cell: {
    width: CELL_WIDTH,
    minHeight: 72,
    borderLeftWidth: 1,
    padding: 5,
    justifyContent: "center",
  },
});
