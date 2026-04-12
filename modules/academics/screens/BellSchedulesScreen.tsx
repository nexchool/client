import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { bellScheduleApi, academicSettingsApi } from "../api/classAcademicApi";
import { qk } from "../hooks/queryKeys";
import type { BellScheduleListItem, BellSchedulePeriod } from "../types";

// ── Period kind config ────────────────────────────────────────────────────────

const KIND_META: Record<string, { color: string; bg: string; label: string }> = {
  lesson:   { color: "#1D1D1F", bg: "#F0F0F5", label: "Lesson" },
  break:    { color: "#7A4E00", bg: "#FFF3D4", label: "Break" },
  lunch:    { color: "#1A5C2E", bg: "#D4F5E2", label: "Lunch" },
  assembly: { color: "#3A1F6B", bg: "#EFE8FF", label: "Assembly" },
  other:    { color: "#555555", bg: "#EFEFEF", label: "Other" },
};

function periodKindMeta(kind: string) {
  return KIND_META[kind] ?? KIND_META.other;
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function formatTime(t: string | null): string {
  if (!t) return "—";
  // datetime "2024-01-01T09:00:00" → slice(11,16); plain time "09:00:00" → slice(0,5)
  const clean = t.length >= 16 ? t.slice(11, 16) : t.slice(0, 5);
  return clean;
}

function parseMinutes(t: string | null): number | null {
  if (!t) return null;
  const clean = t.length >= 16 ? t.slice(11, 16) : t.slice(0, 5);
  const [h, m] = clean.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BellSchedulesScreen() {
  const router = useRouter();

  const { data: bellListRes, isLoading } = useQuery({
    queryKey: qk.bellSchedules(),
    queryFn: () => bellScheduleApi.list(),
  });
  const items = bellListRes?.items ?? [];

  const { data: settings } = useQuery({
    queryKey: qk.academicSettings(),
    queryFn: () => academicSettingsApi.get(),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Tenant default: prefer API list field, then academic settings (same value; list avoids extra round-trip). */
  const defaultId =
    (bellListRes?.tenant_default_bell_schedule_id as string | null | undefined) ??
    (settings?.default_bell_schedule_id as string | undefined) ??
    undefined;

  if (selectedId) {
    return (
      <BellDetailScreen
        id={selectedId}
        onBack={() => setSelectedId(null)}
        isDefault={selectedId === defaultId}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bell schedules</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.textSecondary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="alarm-outline" size={28} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No bell schedules</Text>
          <Text style={styles.emptyDesc}>
            Bell schedules are managed in the admin panel.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <ScheduleCard
              item={item}
              isDefault={item.id === defaultId}
              onPress={() => setSelectedId(item.id)}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.sectionHint}>
              Tap a schedule to view its daily period breakdown.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Schedule card ─────────────────────────────────────────────────────────────

function ScheduleCard({
  item,
  isDefault,
  onPress,
}: {
  item: BellScheduleListItem;
  isDefault: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardIconWrap}>
        <Ionicons name="alarm-outline" size={18} color={Colors.text} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardBadgeRow}>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Ionicons name="star" size={9} color="#7A4E00" style={{ marginRight: 3 }} />
              <Text style={styles.defaultBadgeText}>School default</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ── Detail screen ─────────────────────────────────────────────────────────────

function BellDetailScreen({
  id,
  onBack,
  isDefault,
}: {
  id: string;
  onBack: () => void;
  isDefault: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: qk.bellSchedule(id),
    queryFn: () => bellScheduleApi.get(id),
  });

  const periods: BellSchedulePeriod[] = [...(data?.periods ?? [])].sort(
    (a, b) => (a.sort_order ?? a.period_number) - (b.sort_order ?? b.period_number)
  );

  const periodsWithTimes = periods.filter((p) => p.starts_at && p.ends_at);
  const allMins = periodsWithTimes.flatMap((p) => [
    parseMinutes(p.starts_at)!,
    parseMinutes(p.ends_at)!,
  ]);
  const dayStart = allMins.length ? Math.min(...allMins) : null;
  const dayEnd = allMins.length ? Math.max(...allMins) : null;
  const daySpan = dayStart !== null && dayEnd !== null ? dayEnd - dayStart : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isLoading ? "Loading…" : (data?.name ?? "Schedule")}
        </Text>
        {isDefault ? (
          <View style={styles.defaultPill}>
            <Ionicons name="star" size={10} color="#7A4E00" />
          </View>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {isLoading || !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.textSecondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Summary row */}
          <View style={styles.summaryRow}>
            <SummaryChip
              icon="time-outline"
              value={`${periods.length} period${periods.length !== 1 ? "s" : ""}`}
            />
            {dayStart !== null && dayEnd !== null && (
              <SummaryChip
                icon="calendar-outline"
                value={`${minutesToTime(dayStart)} – ${minutesToTime(dayEnd)}`}
              />
            )}
            {isDefault && (
              <SummaryChip icon="star-outline" value="School default" />
            )}
          </View>

          {/* Timeline */}
          {periodsWithTimes.length > 0 && daySpan > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Day timeline</Text>
              <TimelineBar
                periods={periodsWithTimes}
                dayStart={dayStart!}
                daySpan={daySpan}
              />
              <View style={styles.timelineLabels}>
                <Text style={styles.timelineLabel}>{minutesToTime(dayStart!)}</Text>
                <Text style={styles.timelineLabel}>{minutesToTime(dayEnd!)}</Text>
              </View>
            </View>
          )}

          {/* Period list */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Periods</Text>
            {periods.length === 0 ? (
              <View style={styles.emptyPeriods}>
                <Text style={styles.emptyDesc}>No periods defined.</Text>
              </View>
            ) : (
              periods.map((p, idx) => (
                <PeriodRow key={p.id} period={p} isLast={idx === periods.length - 1} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Timeline bar ──────────────────────────────────────────────────────────────

function TimelineBar({
  periods,
  dayStart,
  daySpan,
}: {
  periods: BellSchedulePeriod[];
  dayStart: number;
  daySpan: number;
}) {
  return (
    <View style={styles.timeline}>
      {periods.map((p) => {
        const start = parseMinutes(p.starts_at)!;
        const end = parseMinutes(p.ends_at)!;
        const leftPct = ((start - dayStart) / daySpan) * 100;
        const widthPct = ((end - start) / daySpan) * 100;
        const meta = periodKindMeta(p.period_kind);

        return (
          <View
            key={p.id}
            style={[
              styles.timelineSegment,
              {
                left: `${leftPct}%` as any,
                width: `${widthPct}%` as any,
                backgroundColor: meta.bg,
              },
            ]}
          >
            {widthPct > 8 && (
              <Text
                style={[styles.timelineSegmentLabel, { color: meta.color }]}
                numberOfLines={1}
              >
                {p.label || `P${p.period_number}`}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Period row ────────────────────────────────────────────────────────────────

function PeriodRow({ period, isLast }: { period: BellSchedulePeriod; isLast: boolean }) {
  const meta = periodKindMeta(period.period_kind);
  const startMins = parseMinutes(period.starts_at);
  const endMins = parseMinutes(period.ends_at);
  const durMins = startMins !== null && endMins !== null ? endMins - startMins : null;

  return (
    <View style={[styles.periodRow, !isLast && styles.periodRowBorder]}>
      {/* Kind indicator strip */}
      <View style={[styles.periodStrip, { backgroundColor: meta.bg }]} />

      <View style={styles.periodMain}>
        <View style={styles.periodLeft}>
          <Text style={styles.periodNumber}>P{period.period_number}</Text>
          <View style={[styles.periodKindBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.periodKindText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
          {period.label ? (
            <Text style={styles.periodLabel} numberOfLines={1}>{period.label}</Text>
          ) : null}
        </View>
        <View style={styles.periodRight}>
          <Text style={styles.periodTime}>
            {formatTime(period.starts_at)} – {formatTime(period.ends_at)}
          </Text>
          {durMins !== null && (
            <Text style={styles.periodDur}>{durMins} min</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Summary chip ──────────────────────────────────────────────────────────────

function SummaryChip({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.summaryChip}>
      <Ionicons name={icon} size={13} color={Colors.textSecondary} />
      <Text style={styles.summaryChipText}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  headerBack: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Layout.borderRadius.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  defaultPill: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  // List
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  cardBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3D4",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: "#7A4E00",
    fontWeight: "600",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },

  // Detail content
  detailContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },

  // Summary chips
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
  },
  summaryChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  // Section
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  // Timeline
  timeline: {
    position: "relative",
    height: 40,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    overflow: "hidden",
  },
  timelineSegment: {
    position: "absolute",
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.borderLight,
    paddingHorizontal: 2,
  },
  timelineSegmentLabel: {
    fontSize: 9,
    fontWeight: "700",
  },
  timelineLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timelineLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "monospace",
  },

  // Period row
  periodRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.sm,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.xs,
  },
  periodRowBorder: {
    // kept for structural clarity; border is on the card itself
  },
  periodStrip: {
    width: 4,
  },
  periodMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  periodLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  periodNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    fontFamily: "monospace",
    minWidth: 28,
  },
  periodKindBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  periodKindText: {
    fontSize: 11,
    fontWeight: "600",
  },
  periodLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
    flexShrink: 1,
  },
  periodRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  periodTime: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  periodDur: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  emptyPeriods: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
});
