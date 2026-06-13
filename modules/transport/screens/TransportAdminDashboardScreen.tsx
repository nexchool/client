import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl } from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { router } from "expo-router";
import { DashboardKpiCard } from "@/modules/home/components/DashboardKpiCard";
import { DashboardActionRow } from "@/modules/home/components/DashboardActionRow";
import { useTransportDashboard } from "../hooks/useTransportAdmin";
import { occupancyTone, clampPercent } from "../utils/occupancy";

export function TransportAdminDashboardScreen() {
  const { t } = useTranslation("transport");
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useTransportDashboard();

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

  const totalBuses = data?.total_buses ?? 0;
  const activeBuses = data?.active_buses ?? 0;
  const students = data?.total_students_on_transport ?? 0;
  const nearCapacity = data?.buses_near_capacity_count ?? 0;
  const routeDist = data?.route_distribution ?? [];
  const occupancy = data?.occupancy_per_bus ?? [];

  const alerts = [
    {
      key: "inactiveRoutes",
      count: data?.students_on_inactive_routes ?? 0,
      label: t("dashboard.alertInactiveRoutes", { defaultValue: "students on inactive routes" }),
    },
    {
      key: "busesNoRoute",
      count: data?.buses_without_active_routes ?? 0,
      label: t("dashboard.alertBusesNoRoute", { defaultValue: "buses without an active route" }),
    },
    {
      key: "driversNoSchedule",
      count: data?.drivers_without_schedules ?? 0,
      label: t("dashboard.alertDriversNoSchedule", { defaultValue: "drivers without a schedule" }),
    },
  ].filter((a) => a.count > 0);

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
      contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.scrollBottom }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" color="onSurface">
          {t("dashboard.title", { defaultValue: "Transport" })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t("dashboard.subtitle", { defaultValue: "Fleet, routes and enrolment at a glance." })}
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
              label={t("dashboard.buses", { defaultValue: "Buses" })}
              value={`${activeBuses}/${totalBuses}`}
              accentColor="primary"
              iconName="bus-outline"
              iconChipBg="primaryContainer"
              iconChipFg="onPrimaryContainer"
            />
          </View>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.students", { defaultValue: "Students" })}
              value={String(students)}
              accentColor="secondary"
              iconName="people-outline"
              iconChipBg="secondaryContainer"
              iconChipFg="onSecondaryContainer"
            />
          </View>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.nearCapacity", { defaultValue: "Near capacity" })}
              value={String(nearCapacity)}
              accentColor={nearCapacity > 0 ? "error" : "success"}
              iconName="alert-circle-outline"
              iconChipBg={nearCapacity > 0 ? "errorContainer" : "surfaceContainerHigh"}
              iconChipFg={nearCapacity > 0 ? "onErrorContainer" : "success"}
            />
          </View>
        </View>
      )}

      {alerts.length > 0 ? (
        <View style={cardStyle}>
          <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
            {t("dashboard.attention", { defaultValue: "Needs attention" })}
          </Text>
          {alerts.map((a, idx) => (
            <View
              key={a.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                paddingVertical: spacing.sm,
                ...rowBorder(idx === alerts.length - 1),
              }}
            >
              <AppIcon name="warning-outline" size="md" color="warning" />
              <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }}>
                <Text variant="labelLg" color="onSurface">{a.count}</Text> {a.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={cardStyle}>
        <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
          {t("dashboard.manage", { defaultValue: "Manage" })}
        </Text>
        <DashboardActionRow
          title={t("dashboard.routes", { defaultValue: "Routes" })}
          subtitle={t("dashboard.routesSub", { defaultValue: "Routes, stops and timings" })}
          iconName="git-branch-outline"
          iconChipBg="primaryContainer"
          iconChipFg="onPrimaryContainer"
          onPress={() => router.push("/(protected)/transport/routes" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.buses", { defaultValue: "Buses" })}
          subtitle={t("dashboard.busesSub", { defaultValue: "Fleet, occupancy and crew" })}
          iconName="bus-outline"
          iconChipBg="secondaryContainer"
          iconChipFg="onSecondaryContainer"
          onPress={() => router.push("/(protected)/transport/buses" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.drivers", { defaultValue: "Drivers" })}
          subtitle={t("dashboard.driversSub", { defaultValue: "Crew contacts and licences" })}
          iconName="people-outline"
          iconChipBg="tertiaryContainer"
          iconChipFg="onTertiaryContainer"
          onPress={() => router.push("/(protected)/transport/drivers" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.enrolment", { defaultValue: "Enrolment" })}
          subtitle={t("dashboard.enrolmentSub", { defaultValue: "Students riding the buses" })}
          iconName="school-outline"
          iconChipBg="primaryContainer"
          iconChipFg="onPrimaryContainer"
          onPress={() => router.push("/(protected)/transport/enrolment" as never)}
        />
      </View>

      <View style={cardStyle}>
        <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
          {t("dashboard.routeDistribution", { defaultValue: "Students per route" })}
        </Text>
        {routeDist.length === 0 ? (
          <EmptyState
            icon={<AppIcon name="git-branch-outline" size="xl" color="onSurfaceVariant" />}
            title={t("dashboard.noRoutes", { defaultValue: "No routes yet" })}
            description={t("dashboard.noRoutesHint", { defaultValue: "Routes and their riders will appear here" })}
          />
        ) : (
          routeDist.map((r, idx) => (
            <View
              key={r.route_id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm,
                ...rowBorder(idx === routeDist.length - 1),
              }}
            >
              <Text variant="bodyMd" color="onSurface" numberOfLines={1} style={{ flex: 1, marginRight: spacing.md }}>
                {r.route_name}
              </Text>
              <Text variant="labelMd" color="primary">
                {t("dashboard.studentsCount", { defaultValue: "{{n}} students", n: r.students })}
              </Text>
            </View>
          ))
        )}
      </View>

      {occupancy.length > 0 ? (
        <View style={cardStyle}>
          <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
            {t("dashboard.busOccupancy", { defaultValue: "Bus occupancy" })}
          </Text>
          {occupancy.map((b, idx) => {
            const pct = clampPercent(b.occupancy_percent);
            const tone = occupancyTone(pct);
            return (
              <View key={b.bus_id} style={{ paddingVertical: spacing.sm, ...rowBorder(idx === occupancy.length - 1) }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing.xs,
                  }}
                >
                  <Text variant="bodyMd" color="onSurface" numberOfLines={1} style={{ flex: 1, marginRight: spacing.md }}>
                    {b.bus_number}
                  </Text>
                  <Text variant="labelMd" color={tone}>
                    {b.occupancy}/{b.capacity}
                  </Text>
                </View>
                <View style={{ height: 6, borderRadius: radius.full, backgroundColor: palette.surfaceContainerHigh, overflow: "hidden" }}>
                  <View style={{ width: `${pct}%`, height: "100%", backgroundColor: palette[tone], borderRadius: radius.full }} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}
