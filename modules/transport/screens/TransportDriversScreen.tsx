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
import { useTransportDrivers } from "../hooks/useTransportAdmin";
import { callPhone } from "@/common/utils/phone";
import type { TransportDriver } from "../adminTypes";

export function TransportDriversScreen() {
  const { t } = useTranslation("transport");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: drivers = [], isLoading, error, refetch, isRefetching } = useTransportDrivers();

  const renderItem = ({ item: d }: { item: TransportDriver }) => {
    const inactive = !!d.status && d.status !== "active";
    return (
      <PressScale
        onPress={() => router.push(`/(protected)/transport/drivers/${d.id}` as never)}
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
            borderRadius: radius.full,
            backgroundColor: palette.tertiaryContainer,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
          }}
        >
          <AppIcon name="person" size="lg" color="onTertiaryContainer" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="labelMd" color="onSurface" numberOfLines={1}>
            {d.name}
          </Text>
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
            {d.phone || t("drivers.noPhone", { defaultValue: "No phone" })}
            {d.license_number ? ` · ${d.license_number}` : ""}
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
              {t("drivers.inactive", { defaultValue: "Inactive" })}
            </Text>
          </View>
        ) : null}
        {d.phone ? (
          <PressScale
            onPress={() => callPhone(d.phone)}
            style={{ padding: spacing.sm, backgroundColor: palette.primaryContainer, borderRadius: radius.full }}
          >
            <AppIcon name="call" size="md" color="onPrimaryContainer" />
          </PressScale>
        ) : (
          <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
        )}
      </PressScale>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <TransportHeader title={t("drivers.title", { defaultValue: "Drivers" })} onBack={() => router.back()} />
      {error ? (
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={error instanceof Error ? error.message : undefined}
          action={{ label: t("common.tryAgain", { defaultValue: "Try again" }), onPress: () => refetch() }}
        />
      ) : isLoading && drivers.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.md, gap: spacing.md }}>
          <Skeleton width="100%" height={76} radius={radius.xl} />
          <Skeleton width="100%" height={76} radius={radius.xl} />
          <Skeleton width="100%" height={76} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={drivers}
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
              icon={<AppIcon name="people-outline" size="xl" color="onSurfaceVariant" />}
              title={t("drivers.emptyTitle", { defaultValue: "No drivers" })}
              description={t("drivers.emptyHint", { defaultValue: "Drivers and helpers will appear here." })}
            />
          }
        />
      )}
    </View>
  );
}
