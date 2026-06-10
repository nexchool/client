import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { TransportHeader } from "../components/TransportHeader";
import { useTransportRoute, useTransportRouteStops } from "../hooks/useTransportAdmin";

type IconName = React.ComponentProps<typeof AppIcon>["name"];

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: IconName;
  label: string;
  value?: string | null;
  last?: boolean;
}) {
  const { palette, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.surfaceContainerHigh,
      }}
    >
      <AppIcon name={icon} size="md" color="onSurfaceVariant" />
      <Text variant="bodySm" color="onSurfaceVariant" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
  );
}

export function TransportRouteDetailScreen() {
  const { t } = useTranslation("transport");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: route, isLoading, error, refetch, isRefetching } = useTransportRoute(id);
  const { data: stops = [] } = useTransportRouteStops(id);

  const cardStyle = [
    elevation.card,
    { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
  ];

  if (error || (!route && !isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <TransportHeader title={t("routeDetail.title", { defaultValue: "Route" })} onBack={() => router.back()} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="onSurfaceVariant" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={t("routeDetail.notFound", { defaultValue: "This route could not be loaded." })}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <TransportHeader
        title={route?.name ?? t("routeDetail.title", { defaultValue: "Route" })}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !route ? (
          <>
            <Skeleton width="100%" height={140} radius={radius.xl} />
            <Skeleton width="100%" height={200} radius={radius.xl} />
          </>
        ) : (
          <>
            <View style={cardStyle}>
              <DetailRow icon="navigate-outline" label={t("routeDetail.start", { defaultValue: "Start" })} value={route?.start_point} />
              <DetailRow icon="flag-outline" label={t("routeDetail.end", { defaultValue: "End" })} value={route?.end_point} />
              <DetailRow icon="time-outline" label={t("routeDetail.pickup", { defaultValue: "Pickup" })} value={route?.pickup_time} />
              <DetailRow icon="time-outline" label={t("routeDetail.drop", { defaultValue: "Drop" })} value={route?.drop_time} />
              <DetailRow
                icon="cash-outline"
                label={t("routeDetail.fee", { defaultValue: "Default fee" })}
                value={route?.default_fee != null ? String(route.default_fee) : null}
                last
              />
            </View>

            <View style={cardStyle}>
              <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
                {t("routeDetail.stops", { defaultValue: "Stops" })}
              </Text>
              {stops.length === 0 ? (
                <Text variant="bodyMd" color="onSurfaceVariant">
                  {t("routeDetail.noStops", { defaultValue: "No stops on this route yet." })}
                </Text>
              ) : (
                stops.map((s, idx) => (
                  <View
                    key={s.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      paddingVertical: spacing.sm,
                      borderBottomWidth: idx === stops.length - 1 ? 0 : 1,
                      borderBottomColor: palette.surfaceContainerHigh,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: radius.full,
                        backgroundColor: palette.primaryContainer,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text variant="labelSm" color="onPrimaryContainer">
                        {s.sequence_order}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" color="onSurface" numberOfLines={1}>
                        {s.name}
                      </Text>
                      {s.pickup_time || s.drop_time ? (
                        <Text variant="labelSm" color="onSurfaceVariant">
                          {[s.pickup_time, s.drop_time].filter(Boolean).join(" · ")}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
