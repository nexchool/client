import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { bellScheduleApi, academicSettingsApi } from "../api/classAcademicApi";
import { qk } from "../hooks/queryKeys";
import type { BellScheduleListItem, BellSchedulePeriod } from "../types";

// ── Period kind config ────────────────────────────────────────────────────────

type ColorKey = keyof ReturnType<typeof useTheme>["palette"];

const KIND_META: Record<
  string,
  { accent: ColorKey; chipBg: ColorKey; chipFg: ColorKey; icon: React.ComponentProps<typeof AppIcon>["name"] }
> = {
  lesson: { accent: "primary", chipBg: "surfaceContainerHigh", chipFg: "onSurfaceVariant", icon: "book-outline" },
  break: { accent: "tertiary", chipBg: "tertiaryContainer", chipFg: "onTertiaryContainer", icon: "cafe-outline" },
  lunch: { accent: "secondary", chipBg: "secondaryContainer", chipFg: "onSecondaryContainer", icon: "restaurant-outline" },
  assembly: { accent: "tertiary", chipBg: "tertiaryContainer", chipFg: "onTertiaryContainer", icon: "megaphone-outline" },
  other: { accent: "outline", chipBg: "surfaceContainerHigh", chipFg: "onSurfaceVariant", icon: "ellipse-outline" },
};

function periodKindMeta(kind: string) {
  return KIND_META[kind] ?? KIND_META.other;
}

const LESSON_KINDS = new Set(["lesson", "assembly"]);

// ── Time helpers ──────────────────────────────────────────────────────────────

function formatTime(t: string | null): string {
  if (!t) return "—";
  return t.length >= 16 ? t.slice(11, 16) : t.slice(0, 5);
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
  const { t } = useTranslation("timetable");
  const { palette, spacing, radius, elevation } = useTheme();

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
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.scrollBottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" color="onSurface">
          {t("bell.title", { defaultValue: "Bell schedules" })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t("bell.subtitle", {
            defaultValue: "Daily period timings for your school.",
          })}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={palette.onSurfaceVariant} />
      ) : items.length === 0 ? (
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.xl,
              alignItems: "center",
              gap: spacing.sm,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: palette.surfaceContainerHigh },
            ]}
          >
            <AppIcon name="alarm-outline" size="xl" color="onSurfaceVariant" />
          </View>
          <Text variant="titleSm" color="onSurface">
            {t("bell.emptyTitle", { defaultValue: "No bell schedules" })}
          </Text>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ textAlign: "center" }}>
            {t("bell.emptyDesc", {
              defaultValue: "Bell schedules are managed in the admin panel.",
            })}
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          {items.map((item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              isDefault={item.id === defaultId}
              onPress={() => setSelectedId(item.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
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
  const { t } = useTranslation("timetable");
  const { palette, spacing, radius, elevation } = useTheme();
  return (
    <PressScale
      onPress={onPress}
      style={[
        elevation.card,
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={[styles.cardIcon, { backgroundColor: palette.surfaceContainerHigh }]}>
        <AppIcon name="alarm-outline" size="md" color="onSurface" />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="titleSm" color="onSurface" numberOfLines={1}>
          {item.name}
        </Text>
        {isDefault ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: palette.secondaryContainer, borderRadius: radius.sm },
            ]}
          >
            <AppIcon name="star" size="sm" color="onSecondaryContainer" />
            <Text variant="labelSm" color="onSecondaryContainer">
              {t("bell.schoolDefault", { defaultValue: "School default" })}
            </Text>
          </View>
        ) : null}
      </View>
      <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
    </PressScale>
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
  const { t } = useTranslation("timetable");
  const { palette, spacing, radius } = useTheme();

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

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.scrollBottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon
          name="arrow-back"
          size="lg"
          color="onSurface"
          onPress={onBack}
          accessibilityLabel={t("bell.back", { defaultValue: "Back to schedules" })}
        />
        <View style={{ flex: 1 }}>
          <Text variant="headlineMd" color="onSurface" numberOfLines={1}>
            {isLoading ? t("loading", { defaultValue: "Loading…" }) : data?.name ?? t("bell.scheduleFallback", { defaultValue: "Schedule" })}
          </Text>
          {!isLoading && dayStart !== null && dayEnd !== null ? (
            <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: 2 }}>
              {minutesToTime(dayStart)} – {minutesToTime(dayEnd)} · {periods.length}{" "}
              {periods.length === 1
                ? t("bell.period", { defaultValue: "period" })
                : t("bell.periods", { defaultValue: "periods" })}
            </Text>
          ) : null}
        </View>
        {isDefault ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: palette.secondaryContainer, borderRadius: radius.sm },
            ]}
          >
            <AppIcon name="star" size="sm" color="onSecondaryContainer" />
            <Text variant="labelSm" color="onSecondaryContainer">
              {t("bell.active", { defaultValue: "Active" })}
            </Text>
          </View>
        ) : null}
      </View>

      {isLoading || !data ? (
        <ActivityIndicator color={palette.onSurfaceVariant} />
      ) : periods.length === 0 ? (
        <Text variant="bodyMd" color="onSurfaceVariant">
          {t("bell.noPeriods", { defaultValue: "No periods defined." })}
        </Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {periods.map((p, idx) => (
            <TimelineRow key={p.id} period={p} isLast={idx === periods.length - 1} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Timeline row ──────────────────────────────────────────────────────────────

function TimelineRow({ period, isLast }: { period: BellSchedulePeriod; isLast: boolean }) {
  const { t } = useTranslation("timetable");
  const { palette, spacing, radius } = useTheme();
  const meta = periodKindMeta(period.period_kind);
  const isLesson = LESSON_KINDS.has(period.period_kind);

  const startMins = parseMinutes(period.starts_at);
  const endMins = parseMinutes(period.ends_at);
  const durMins = startMins !== null && endMins !== null ? endMins - startMins : null;

  const title =
    period.label ||
    (isLesson
      ? t("bell.periodN", { defaultValue: "Period {{n}}", n: period.period_number })
      : periodKindLabel(period.period_kind, t));

  return (
    <View style={{ flexDirection: "row", gap: spacing.md }}>
      {/* Time + rail */}
      <View style={{ width: 64, alignItems: "flex-end" }}>
        <Text variant="labelMd" color="onSurface">
          {formatTime(period.starts_at)}
        </Text>
        <Text variant="labelSm" color="onSurfaceVariant">
          {formatTime(period.ends_at)}
        </Text>
      </View>

      <View style={{ alignItems: "center", width: 14 }}>
        <View
          style={[
            styles.timelineDot,
            { borderColor: palette[meta.accent], backgroundColor: palette.surfaceContainerLowest },
          ]}
        />
        {!isLast ? (
          <View style={{ flex: 1, width: 2, backgroundColor: palette.surfaceContainer, marginTop: 2 }} />
        ) : null}
      </View>

      {/* Card */}
      <View
        style={{
          flex: 1,
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.surfaceContainerHigh,
          borderLeftWidth: 4,
          borderLeftColor: palette[meta.accent],
          padding: spacing.md,
          marginBottom: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        {!isLesson ? (
          <View style={[styles.kindIcon, { backgroundColor: palette[meta.chipBg] }]}>
            <AppIcon name={meta.icon} size="sm" color={meta.chipFg} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="titleSm" color="onSurface" numberOfLines={1}>
            {title}
          </Text>
          {durMins !== null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <AppIcon name="time-outline" size="sm" color="onSurfaceVariant" />
              <Text variant="labelSm" color="onSurfaceVariant">
                {t("bell.minutes", { defaultValue: "{{n}} min", n: durMins })}
              </Text>
            </View>
          ) : null}
        </View>
        {isLesson ? (
          <View
            style={[
              styles.chip,
              { backgroundColor: palette[meta.chipBg], borderRadius: radius.sm },
            ]}
          >
            <Text variant="labelSm" color={meta.chipFg}>
              {periodKindLabel(period.period_kind, t)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function periodKindLabel(
  kind: string,
  t: (k: string, o: { defaultValue: string }) => string
): string {
  switch (kind) {
    case "lesson":
      return t("bell.kindLesson", { defaultValue: "Lesson" });
    case "break":
      return t("bell.kindBreak", { defaultValue: "Break" });
    case "lunch":
      return t("bell.kindLunch", { defaultValue: "Lunch" });
    case "assembly":
      return t("bell.kindAssembly", { defaultValue: "Assembly" });
    default:
      return t("bell.kindOther", { defaultValue: "Other" });
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
  },
  kindIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
