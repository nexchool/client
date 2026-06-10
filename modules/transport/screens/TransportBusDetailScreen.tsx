import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { TransportHeader } from "../components/TransportHeader";
import { useTransportBusDetails } from "../hooks/useTransportAdmin";
import { occupancyTone, clampPercent } from "../utils/occupancy";

export function TransportBusDetailScreen() {
  const { t } = useTranslation("transport");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useTransportBusDetails(id);

  const cardStyle = [
    elevation.card,
    { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
  ];
  const rowBorder = (last: boolean) => ({
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: palette.surfaceContainerHigh,
  });

  if (error || (!data && !isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <TransportHeader title={t("busDetail.title", { defaultValue: "Bus" })} onBack={() => router.back()} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="onSurfaceVariant" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={t("busDetail.notFound", { defaultValue: "This bus could not be loaded." })}
        />
      </View>
    );
  }

  const bus = data?.bus;
  const capacity = data?.capacity ?? bus?.capacity ?? 0;
  const occupancy = data?.occupancy ?? 0;
  const pct = clampPercent(data?.occupancy_percent);
  const tone = occupancyTone(pct);
  const warning =
    data?.transport_operational && data.transport_operational.code !== "ok"
      ? data.transport_operational.message
      : null;
  const driver = data?.driver;
  const helper = data?.helper;
  const route = data?.route;
  const students = data?.students ?? [];
  const timeline = data?.schedule_timeline ?? [];

  const call = (phone?: string | null) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <TransportHeader
        title={bus?.bus_number ?? t("busDetail.title", { defaultValue: "Bus" })}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !data ? (
          <>
            <Skeleton width="100%" height={140} radius={radius.xl} />
            <Skeleton width="100%" height={120} radius={radius.xl} />
            <Skeleton width="100%" height={180} radius={radius.xl} />
          </>
        ) : (
          <>
            {/* Overview: occupancy */}
            <View style={cardStyle}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                <View>
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {t("busDetail.occupancy", { defaultValue: "Occupancy" })}
                  </Text>
                  <Text variant="headlineLg" color="onSurface">
                    {occupancy}
                    <Text variant="bodyMd" color="onSurfaceVariant">
                      {" "}
                      / {capacity}
                    </Text>
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                    backgroundColor: palette.surfaceContainerHigh,
                  }}
                >
                  <Text variant="labelMd" color={tone}>
                    {pct}%
                  </Text>
                </View>
              </View>
              <View style={{ height: 8, borderRadius: radius.full, backgroundColor: palette.surfaceContainerHigh, overflow: "hidden" }}>
                <View style={{ width: `${pct}%`, height: "100%", backgroundColor: palette[tone], borderRadius: radius.full }} />
              </View>
              {bus?.vehicle_number ? (
                <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: spacing.sm }}>
                  {t("busDetail.plate", { defaultValue: "Plate" })}: {bus.vehicle_number}
                </Text>
              ) : null}
              {warning ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm }}>
                  <AppIcon name="warning-outline" size="sm" color="warning" />
                  <Text variant="labelSm" color="warning" style={{ flex: 1 }}>
                    {warning}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Crew */}
            <View style={cardStyle}>
              <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
                {t("busDetail.crew", { defaultValue: "Crew" })}
              </Text>
              {driver ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, ...rowBorder(!helper) }}>
                  <AppIcon name="person-circle-outline" size="lg" color="primary" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" color="onSurface">{driver.name}</Text>
                    <Text variant="labelSm" color="onSurfaceVariant">
                      {t("busDetail.driver", { defaultValue: "Driver" })}
                      {driver.phone ? ` · ${driver.phone}` : ""}
                    </Text>
                  </View>
                  {driver.phone ? (
                    <PressScale
                      onPress={() => call(driver.phone)}
                      style={{ padding: spacing.sm, backgroundColor: palette.primaryContainer, borderRadius: radius.full }}
                    >
                      <AppIcon name="call" size="md" color="onPrimaryContainer" />
                    </PressScale>
                  ) : null}
                </View>
              ) : (
                <Text variant="bodyMd" color="onSurfaceVariant" style={{ paddingVertical: spacing.sm, ...rowBorder(!helper) }}>
                  {t("busDetail.noDriver", { defaultValue: "No driver assigned" })}
                </Text>
              )}
              {helper ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm }}>
                  <AppIcon name="person-outline" size="lg" color="secondary" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" color="onSurface">{helper.name}</Text>
                    <Text variant="labelSm" color="onSurfaceVariant">
                      {t("busDetail.helper", { defaultValue: "Helper" })}
                      {helper.phone ? ` · ${helper.phone}` : ""}
                    </Text>
                  </View>
                  {helper.phone ? (
                    <PressScale
                      onPress={() => call(helper.phone)}
                      style={{ padding: spacing.sm, backgroundColor: palette.secondaryContainer, borderRadius: radius.full }}
                    >
                      <AppIcon name="call" size="md" color="onSecondaryContainer" />
                    </PressScale>
                  ) : null}
                </View>
              ) : null}
            </View>

            {/* Route */}
            <View style={cardStyle}>
              <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
                {t("busDetail.route", { defaultValue: "Route" })}
              </Text>
              {route ? (
                <PressScale
                  onPress={() => router.push(`/(protected)/transport/routes/${route.id}` as never)}
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs }}
                >
                  <AppIcon name="git-branch-outline" size="md" color="primary" />
                  <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }} numberOfLines={1}>
                    {route.name}
                  </Text>
                  <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
                </PressScale>
              ) : (
                <Text variant="bodyMd" color="onSurfaceVariant">
                  {t("busDetail.noRoute", { defaultValue: "No active route" })}
                </Text>
              )}
            </View>

            {/* Students on board */}
            <View style={cardStyle}>
              <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
                {t("busDetail.students", { defaultValue: "Students" })} · {students.length}
              </Text>
              {students.length === 0 ? (
                <Text variant="bodyMd" color="onSurfaceVariant">
                  {t("busDetail.noStudents", { defaultValue: "No students enrolled on this bus." })}
                </Text>
              ) : (
                students.map((s, idx) => (
                  <View key={s.enrollment_id} style={{ paddingVertical: spacing.sm, ...rowBorder(idx === students.length - 1) }}>
                    <Text variant="bodyMd" color="onSurface" numberOfLines={1}>
                      {s.student_name || t("busDetail.unnamed", { defaultValue: "Unnamed" })}
                    </Text>
                    <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
                      {s.admission_number ? `#${s.admission_number}` : ""}
                      {s.pickup_point ? `${s.admission_number ? " · " : ""}${s.pickup_point}` : ""}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Today's schedule */}
            {timeline.length > 0 ? (
              <View style={cardStyle}>
                <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
                  {t("busDetail.schedule", { defaultValue: "Today's schedule" })}
                </Text>
                {timeline.map((blk, idx) => (
                  <View
                    key={`${blk.schedule_id ?? blk.exception_id ?? "blk"}-${idx}`}
                    style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, ...rowBorder(idx === timeline.length - 1) }}
                  >
                    <AppIcon
                      name={blk.shift_type === "drop" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                      size="md"
                      color={blk.is_exception ? "warning" : "primary"}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" color="onSurface" numberOfLines={1}>
                        {blk.route?.name ?? t("busDetail.unscheduled", { defaultValue: "Unscheduled" })}
                      </Text>
                      <Text variant="labelSm" color="onSurfaceVariant">
                        {blk.shift_type} · {blk.start_time}–{blk.end_time}
                        {blk.driver?.name ? ` · ${blk.driver.name}` : ""}
                      </Text>
                    </View>
                    {blk.is_exception ? (
                      <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: palette.surfaceContainerHigh }}>
                        <Text variant="labelSm" color="warning">
                          {t("busDetail.exception", { defaultValue: "Changed" })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
