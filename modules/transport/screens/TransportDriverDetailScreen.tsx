import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { TransportHeader } from "../components/TransportHeader";
import { useTransportDriver } from "../hooks/useTransportAdmin";
import { callPhone } from "@/common/utils/phone";

type IconName = React.ComponentProps<typeof AppIcon>["name"];

function DetailRow({ icon, label, value, last }: { icon: IconName; label: string; value?: string | null; last?: boolean }) {
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
      <Text variant="bodyMd" color="onSurface" style={{ flex: 1 }} numberOfLines={2}>
        {value || "—"}
      </Text>
    </View>
  );
}

export function TransportDriverDetailScreen() {
  const { t } = useTranslation("transport");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: driver, isLoading, error, refetch, isRefetching } = useTransportDriver(id);

  const cardStyle = [
    elevation.card,
    { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
  ];

  if (error || (!driver && !isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <TransportHeader title={t("driverDetail.title", { defaultValue: "Driver" })} onBack={() => router.back()} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="onSurfaceVariant" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={t("driverDetail.notFound", { defaultValue: "This driver could not be loaded." })}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <TransportHeader
        title={driver?.name ?? t("driverDetail.title", { defaultValue: "Driver" })}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !driver ? (
          <Skeleton width="100%" height={220} radius={radius.xl} />
        ) : (
          <>
            <View style={cardStyle}>
              <DetailRow icon="call-outline" label={t("driverDetail.phone", { defaultValue: "Phone" })} value={driver?.phone} />
              <DetailRow
                icon="call-outline"
                label={t("driverDetail.altPhone", { defaultValue: "Alt. phone" })}
                value={driver?.alternate_phone}
              />
              <DetailRow
                icon="card-outline"
                label={t("driverDetail.license", { defaultValue: "Licence" })}
                value={driver?.license_number}
              />
              <DetailRow
                icon="location-outline"
                label={t("driverDetail.address", { defaultValue: "Address" })}
                value={driver?.address}
              />
              <DetailRow
                icon="ellipse-outline"
                label={t("driverDetail.status", { defaultValue: "Status" })}
                value={driver?.status}
                last
              />
            </View>

            {driver?.phone ? (
              <PressScale
                onPress={() => callPhone(driver.phone)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  backgroundColor: palette.primary,
                  borderRadius: radius.lg,
                  paddingVertical: spacing.md,
                }}
              >
                <AppIcon name="call" size="md" color="onPrimary" />
                <Text variant="labelLg" color="onPrimary">
                  {t("driverDetail.call", { defaultValue: "Call driver" })}
                </Text>
              </PressScale>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
