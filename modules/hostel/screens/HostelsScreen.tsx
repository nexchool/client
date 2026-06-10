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
import { BackHeader } from "@/common/components/BackHeader";
import { useHostels } from "../hooks/useHostelAdmin";
import type { Hostel } from "../adminTypes";

export function HostelsScreen() {
  const { t } = useTranslation("hostel");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: hostels = [], isLoading, error, refetch, isRefetching } = useHostels();

  const renderItem = ({ item: h }: { item: Hostel }) => {
    const inactive = h.status !== "active";
    return (
      <PressScale
        onPress={() => router.push(`/(protected)/hostel/buildings/${h.id}` as never)}
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
          <AppIcon name="business" size="lg" color="onPrimaryContainer" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="labelMd" color="onSurface" numberOfLines={1}>
            {h.name}
          </Text>
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
            {t("buildings.capacity", { defaultValue: "{{n}} beds", n: h.capacity })}
            {h.warden_name ? ` · ${h.warden_name}` : ""}
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
              {h.status === "maintenance"
                ? t("buildings.maintenance", { defaultValue: "Maintenance" })
                : t("buildings.inactive", { defaultValue: "Inactive" })}
            </Text>
          </View>
        ) : null}
        <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
      </PressScale>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader title={t("buildings.title", { defaultValue: "Buildings" })} onBack={() => router.back()} />
      {error ? (
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={error instanceof Error ? error.message : undefined}
          action={{ label: t("common.tryAgain", { defaultValue: "Try again" }), onPress: () => refetch() }}
        />
      ) : isLoading && hostels.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.md, gap: spacing.md }}>
          <Skeleton width="100%" height={76} radius={radius.xl} />
          <Skeleton width="100%" height={76} radius={radius.xl} />
          <Skeleton width="100%" height={76} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={hostels}
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
              icon={<AppIcon name="business-outline" size="xl" color="onSurfaceVariant" />}
              title={t("buildings.emptyTitle", { defaultValue: "No hostels" })}
              description={t("buildings.emptyHint", { defaultValue: "Hostel buildings will appear here." })}
            />
          }
        />
      )}
    </View>
  );
}
