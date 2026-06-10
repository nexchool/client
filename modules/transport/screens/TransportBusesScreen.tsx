import React from "react";
import { useTranslation } from "react-i18next";
import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { TransportHeader } from "../components/TransportHeader";
import { useTransportBuses } from "../hooks/useTransportAdmin";
import { occupancyTone, clampPercent } from "../utils/occupancy";
import type { TransportBus } from "../adminTypes";

export function TransportBusesScreen() {
  const { t } = useTranslation("transport");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: buses = [], isLoading, error, refetch, isRefetching } = useTransportBuses();

  const renderItem = ({ item: b }: { item: TransportBus }) => {
    const inactive = !!b.status && b.status !== "active";
    const capacity = b.capacity ?? 0;
    const occupancy = b.occupancy_count ?? 0;
    const pct = clampPercent(b.occupancy_percent ?? (capacity ? (occupancy / capacity) * 100 : 0));
    const tone = occupancyTone(pct);
    const warning =
      b.transport_operational && b.transport_operational.code !== "ok"
        ? b.transport_operational.message
        : null;

    return (
      <PressScale
        onPress={() => router.push(`/(protected)/transport/buses/${b.id}` as never)}
        style={[
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: palette.secondaryContainer,
              alignItems: "center",
              justifyContent: "center",
              marginRight: spacing.md,
            }}
          >
            <AppIcon name="bus" size="lg" color="onSecondaryContainer" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="labelMd" color="onSurface" numberOfLines={1}>
              {b.bus_number}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
              {b.vehicle_number || t("buses.noPlate", { defaultValue: "No plate" })}
              {b.assigned_route?.name ? ` · ${b.assigned_route.name}` : ""}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", marginRight: spacing.sm }}>
            <Text variant="labelMd" color={tone}>
              {occupancy}/{capacity}
            </Text>
            {inactive ? (
              <Text variant="labelSm" color="onSurfaceVariant">
                {t("buses.inactive", { defaultValue: "Inactive" })}
              </Text>
            ) : null}
          </View>
          <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
        </View>

        <View
          style={{
            height: 6,
            borderRadius: radius.full,
            backgroundColor: palette.surfaceContainerHigh,
            overflow: "hidden",
            marginTop: spacing.sm,
          }}
        >
          <View style={{ width: `${pct}%`, height: "100%", backgroundColor: palette[tone], borderRadius: radius.full }} />
        </View>

        {warning ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm }}>
            <AppIcon name="warning-outline" size="sm" color="warning" />
            <Text variant="labelSm" color="warning" style={{ flex: 1 }} numberOfLines={1}>
              {warning}
            </Text>
          </View>
        ) : null}
      </PressScale>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <TransportHeader title={t("buses.title", { defaultValue: "Buses" })} onBack={() => router.back()} />
      {error ? (
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={error instanceof Error ? error.message : undefined}
          action={{ label: t("common.tryAgain", { defaultValue: "Try again" }), onPress: () => refetch() }}
        />
      ) : isLoading && buses.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.md, gap: spacing.md }}>
          <Skeleton width="100%" height={96} radius={radius.xl} />
          <Skeleton width="100%" height={96} radius={radius.xl} />
          <Skeleton width="100%" height={96} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl * 2,
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={<AppIcon name="bus-outline" size="xl" color="onSurfaceVariant" />}
              title={t("buses.emptyTitle", { defaultValue: "No buses" })}
              description={t("buses.emptyHint", { defaultValue: "Buses in your fleet will appear here." })}
            />
          }
        />
      )}
    </View>
  );
}
