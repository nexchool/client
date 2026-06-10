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
import { useTransportRoutes } from "../hooks/useTransportAdmin";
import type { TransportRoute } from "../adminTypes";

export function TransportRoutesScreen() {
  const { t } = useTranslation("transport");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: routes = [], isLoading, error, refetch, isRefetching } = useTransportRoutes();

  const renderItem = ({ item: r }: { item: TransportRoute }) => {
    const inactive = !!r.status && r.status !== "active";
    const stopCount = r.stops_count ?? r.stops?.length ?? 0;
    return (
      <PressScale
        onPress={() => router.push(`/(protected)/transport/routes/${r.id}` as never)}
        style={[
          elevation.card,
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.md,
            marginBottom: spacing.md,
          },
        ]}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: palette.primaryContainer,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
          }}
        >
          <AppIcon name="git-branch" size="lg" color="onPrimaryContainer" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="labelMd" color="onSurface" numberOfLines={1}>
            {r.name}
          </Text>
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
            {t("routes.stopsCount", { defaultValue: "{{n}} stops", n: stopCount })}
            {r.pickup_time ? ` · ${r.pickup_time}` : ""}
          </Text>
        </View>
        {inactive ? (
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: radius.full,
              backgroundColor: palette.surfaceContainerHigh,
              marginRight: spacing.sm,
            }}
          >
            <Text variant="labelSm" color="onSurfaceVariant">
              {t("routes.inactive", { defaultValue: "Inactive" })}
            </Text>
          </View>
        ) : null}
        <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
      </PressScale>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <TransportHeader title={t("routes.title", { defaultValue: "Routes" })} onBack={() => router.back()} />
      {error ? (
        <View style={{ padding: spacing.lg, alignItems: "center" }}>
          <Text variant="bodyMd" color="error">
            {error instanceof Error ? error.message : t("common.failedToLoad", { defaultValue: "Failed to load" })}
          </Text>
        </View>
      ) : isLoading && routes.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.md, gap: spacing.md }}>
          <Skeleton width="100%" height={76} radius={radius.xl} />
          <Skeleton width="100%" height={76} radius={radius.xl} />
          <Skeleton width="100%" height={76} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={routes}
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
              icon={<AppIcon name="git-branch-outline" size="xl" color="onSurfaceVariant" />}
              title={t("routes.emptyTitle", { defaultValue: "No routes" })}
              description={t("routes.emptyHint", { defaultValue: "Transport routes will appear here." })}
            />
          }
        />
      )}
    </View>
  );
}
