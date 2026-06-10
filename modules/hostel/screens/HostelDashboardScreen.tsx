import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { DashboardKpiCard } from "@/modules/home/components/DashboardKpiCard";
import { DashboardActionRow } from "@/modules/home/components/DashboardActionRow";
import { occupancyTone, clampPercent } from "@/common/utils/occupancy";
import { formatDateTime } from "@/common/utils/datetime";
import { useHostelDashboard } from "../hooks/useHostelAdmin";

export function HostelDashboardScreen() {
  const { t } = useTranslation("hostel");
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useHostelDashboard();

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <AppIcon name="alert-circle-outline" size="xl" color="error" />
        <Text variant="bodyMd" color="error" style={{ marginTop: spacing.md, textAlign: "center" }}>
          {error instanceof Error ? error.message : t("common.failedToLoad", { defaultValue: "Failed to load" })}
        </Text>
        <PressScale
          onPress={() => refetch()}
          style={{
            marginTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: palette.primary,
            borderRadius: radius.md,
          }}
        >
          <Text variant="labelMd" color="onPrimary">
            {t("common.tryAgain", { defaultValue: "Try again" })}
          </Text>
        </PressScale>
      </View>
    );
  }

  const occupancy = data?.occupancy ?? [];
  const overdue = data?.overdue_gatepasses ?? [];
  const visitorsInside = data?.visitors_inside ?? 0;
  const totalBeds = occupancy.reduce((s, o) => s + (o.total_beds ?? 0), 0);
  const allocated = occupancy.reduce((s, o) => s + (o.active_allocations ?? 0), 0);

  const cardStyle = [
    elevation.card,
    { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
  ];
  const rowBorder = (last: boolean) => ({
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: palette.surfaceContainerHigh,
  });

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 3 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" color="onSurface">
          {t("dashboard.title", { defaultValue: "Hostel" })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t("dashboard.subtitle", { defaultValue: "Occupancy, gate passes and visitors." })}
        </Text>
      </View>

      {isLoading && !data ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Skeleton width="48%" height={120} radius={radius.xl} />
          <Skeleton width="48%" height={120} radius={radius.xl} />
          <Skeleton width="48%" height={120} radius={radius.xl} />
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.occupied", { defaultValue: "Occupied" })}
              value={`${allocated}/${totalBeds}`}
              accentColor="primary"
              iconName="bed-outline"
              iconChipBg="primaryContainer"
              iconChipFg="onPrimaryContainer"
            />
          </View>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.overdue", { defaultValue: "Overdue passes" })}
              value={String(overdue.length)}
              accentColor={overdue.length > 0 ? "error" : "success"}
              iconName="alarm-outline"
              iconChipBg={overdue.length > 0 ? "errorContainer" : "surfaceContainerHigh"}
              iconChipFg={overdue.length > 0 ? "onErrorContainer" : "success"}
            />
          </View>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.visitorsInside", { defaultValue: "Visitors inside" })}
              value={String(visitorsInside)}
              accentColor="secondary"
              iconName="walk-outline"
              iconChipBg="secondaryContainer"
              iconChipFg="onSecondaryContainer"
            />
          </View>
        </View>
      )}

      {overdue.length > 0 ? (
        <View style={cardStyle}>
          <Text variant="headlineMd" color="error" style={{ marginBottom: spacing.sm }}>
            {t("dashboard.overdueTitle", { defaultValue: "Overdue gate passes" })}
          </Text>
          {overdue.map((gp, idx) => (
            <PressScale
              key={gp.id}
              onPress={() => router.push(`/(protected)/hostel/gatepasses/${gp.id}` as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                paddingVertical: spacing.sm,
                ...rowBorder(idx === overdue.length - 1),
              }}
            >
              <AppIcon name="alarm-outline" size="md" color="error" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMd" color="onSurface" numberOfLines={1}>
                  {gp.student_name || t("common.unnamed", { defaultValue: "Unnamed" })}
                </Text>
                <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
                  {t("dashboard.dueBack", { defaultValue: "Due back" })} {formatDateTime(gp.expected_return_datetime)}
                </Text>
              </View>
              <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
            </PressScale>
          ))}
        </View>
      ) : null}

      <View style={cardStyle}>
        <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
          {t("dashboard.manage", { defaultValue: "Manage" })}
        </Text>
        <DashboardActionRow
          title={t("dashboard.gatepasses", { defaultValue: "Gate passes" })}
          subtitle={t("dashboard.gatepassesSub", { defaultValue: "Approve, reject, check in/out" })}
          iconName="exit-outline"
          iconChipBg="primaryContainer"
          iconChipFg="onPrimaryContainer"
          onPress={() => router.push("/(protected)/hostel/gatepasses" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.visitors", { defaultValue: "Visitors" })}
          subtitle={t("dashboard.visitorsSub", { defaultValue: "Who's inside, check in/out" })}
          iconName="walk-outline"
          iconChipBg="secondaryContainer"
          iconChipFg="onSecondaryContainer"
          onPress={() => router.push("/(protected)/hostel/visitors" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.residents", { defaultValue: "Residents" })}
          subtitle={t("dashboard.residentsSub", { defaultValue: "Who's allocated where" })}
          iconName="people-outline"
          iconChipBg="tertiaryContainer"
          iconChipFg="onTertiaryContainer"
          onPress={() => router.push("/(protected)/hostel/residents" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.buildings", { defaultValue: "Buildings" })}
          subtitle={t("dashboard.buildingsSub", { defaultValue: "Hostels, rooms and beds" })}
          iconName="business-outline"
          iconChipBg="primaryContainer"
          iconChipFg="onPrimaryContainer"
          onPress={() => router.push("/(protected)/hostel/buildings" as never)}
        />
      </View>

      <View style={cardStyle}>
        <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
          {t("dashboard.occupancyByHostel", { defaultValue: "Occupancy by hostel" })}
        </Text>
        {occupancy.length === 0 ? (
          <EmptyState
            icon={<AppIcon name="business-outline" size="xl" color="onSurfaceVariant" />}
            title={t("dashboard.noHostels", { defaultValue: "No hostels yet" })}
            description={t("dashboard.noHostelsHint", { defaultValue: "Hostel occupancy will appear here." })}
          />
        ) : (
          occupancy.map((o, idx) => {
            const pct = clampPercent(o.occupancy_pct);
            const tone = occupancyTone(pct);
            return (
              <View key={o.hostel_id} style={{ paddingVertical: spacing.sm, ...rowBorder(idx === occupancy.length - 1) }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs }}>
                  <Text variant="bodyMd" color="onSurface" numberOfLines={1} style={{ flex: 1, marginRight: spacing.md }}>
                    {o.hostel_name}
                  </Text>
                  <Text variant="labelMd" color={tone}>
                    {o.active_allocations}/{o.total_beds}
                  </Text>
                </View>
                <View style={{ height: 6, borderRadius: radius.full, backgroundColor: palette.surfaceContainerHigh, overflow: "hidden" }}>
                  <View style={{ width: `${pct}%`, height: "100%", backgroundColor: palette[tone], borderRadius: radius.full }} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
