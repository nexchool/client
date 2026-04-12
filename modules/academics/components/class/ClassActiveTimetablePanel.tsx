import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing } from "@/common/constants/spacing";
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
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!hasActive || lessonPeriods.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={36} color={Colors.textTertiary} />
        <Text style={styles.emptyTitle}>No timetable available</Text>
        <Text style={styles.emptyHint}>The active timetable will appear here once published.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timetable</Text>
        {scheduleName ? (
          <Text style={styles.headerSub}>{scheduleName}</Text>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Column headers */}
          <View style={styles.gridHeaderRow}>
            <View style={styles.dayLabelCell} />
            {lessonPeriods.map((lp) => (
              <View key={lp.period_number} style={styles.periodHeaderCell}>
                <Text style={styles.periodHeaderLabel} numberOfLines={1}>
                  {lp.label || `P${lp.period_number}`}
                </Text>
                {(lp.starts_at || lp.ends_at) ? (
                  <Text style={styles.periodHeaderTime}>
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
            <View key={dow} style={styles.gridRow}>
              <View style={styles.dayLabelCell}>
                <Text style={styles.dayLabel}>{DOW_LABELS[dow] ?? `D${dow}`}</Text>
              </View>
              {lessonPeriods.map((lp) => {
                const entry = cellMap.get(`${dow}-${lp.period_number}`);
                return (
                  <View key={lp.period_number} style={[styles.cell, !entry && styles.cellEmpty]}>
                    {entry ? (
                      <>
                        <Text style={styles.cellSubject} numberOfLines={2}>
                          {entry.subject_name ?? "—"}
                        </Text>
                        {entry.teacher_name ? (
                          <Text style={styles.cellTeacher} numberOfLines={1}>
                            {entry.teacher_name}
                          </Text>
                        ) : null}
                        {entry.room ? (
                          <Text style={styles.cellRoom} numberOfLines={1}>
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
  center: { paddingVertical: Spacing.xl, alignItems: "center" },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gridHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 2,
  },
  dayLabelCell: {
    width: DAY_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  periodHeaderCell: {
    width: CELL_WIDTH,
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: 4,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
  },
  periodHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  periodHeaderTime: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 1,
  },
  gridRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  cell: {
    width: CELL_WIDTH,
    minHeight: 72,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
    padding: 5,
    justifyContent: "center",
  },
  cellEmpty: {
    backgroundColor: Colors.backgroundSecondary,
  },
  cellSubject: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 14,
  },
  cellTeacher: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  cellRoom: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 1,
  },
});
