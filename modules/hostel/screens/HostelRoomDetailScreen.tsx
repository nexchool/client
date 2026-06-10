import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { BackHeader } from "@/common/components/BackHeader";
import { useHostelRoom } from "../hooks/useHostelAdmin";
import type { HostelBed } from "../adminTypes";

/** Bed → tone + label. Occupied beds show the occupant; the rest show status. */
function bedTone(bed: HostelBed): keyof Palette {
  if (bed.status === "removed") return "onSurfaceVariant";
  if (bed.status === "maintenance") return "warning";
  return bed.is_allocated ? "primary" : "success";
}

export function HostelRoomDetailScreen() {
  const { t } = useTranslation("hostel");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useHostelRoom(id);

  if (error || (!data && !isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("room.title", { defaultValue: "Room" })} onBack={() => router.back()} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="onSurfaceVariant" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={t("room.notFound", { defaultValue: "This room could not be loaded." })}
        />
      </View>
    );
  }

  const room = data?.room;
  const beds = data?.beds ?? [];
  const occupied = beds.filter((b) => b.is_allocated).length;
  const available = beds.filter((b) => !b.is_allocated && b.status === "active").length;

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader
        title={room ? t("room.heading", { defaultValue: "Room {{n}}", n: room.room_number }) : t("room.title", { defaultValue: "Room" })}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.marginMobile, gap: spacing.lg, paddingBottom: spacing.xl * 2 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !data ? (
          <>
            <Skeleton width="100%" height={80} radius={radius.xl} />
            <Skeleton width="100%" height={200} radius={radius.xl} />
          </>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View
                style={[
                  elevation.card,
                  { flex: 1, backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
                ]}
              >
                <Text variant="labelSm" color="onSurfaceVariant">
                  {t("room.occupied", { defaultValue: "Occupied" })}
                </Text>
                <Text variant="headlineLg" color="primary">{occupied}</Text>
              </View>
              <View
                style={[
                  elevation.card,
                  { flex: 1, backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
                ]}
              >
                <Text variant="labelSm" color="onSurfaceVariant">
                  {t("room.available", { defaultValue: "Available" })}
                </Text>
                <Text variant="headlineLg" color="success">{available}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {beds.length === 0 ? (
                <EmptyState
                  icon={<AppIcon name="bed-outline" size="xl" color="onSurfaceVariant" />}
                  title={t("room.noBeds", { defaultValue: "No beds" })}
                  description={t("room.noBedsHint", { defaultValue: "Beds in this room will appear here." })}
                />
              ) : (
                beds.map((bed) => {
                  const tone = bedTone(bed);
                  return (
                    <View
                      key={bed.id}
                      style={[
                        elevation.card,
                        {
                          width: "48%",
                          backgroundColor: palette.surfaceContainerLowest,
                          borderRadius: radius.lg,
                          padding: spacing.md,
                          borderLeftWidth: 3,
                          borderLeftColor: palette[tone],
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                        <AppIcon name="bed-outline" size="sm" color={tone} />
                        <Text variant="labelMd" color="onSurface">
                          {t("room.bed", { defaultValue: "Bed {{n}}", n: bed.bed_number })}
                        </Text>
                      </View>
                      <Text variant="bodySm" color="onSurface" numberOfLines={1} style={{ marginTop: spacing.xs }}>
                        {bed.occupant
                          ? bed.occupant.name
                          : bed.status === "maintenance"
                          ? t("room.maintenance", { defaultValue: "Maintenance" })
                          : bed.status === "removed"
                          ? t("room.removed", { defaultValue: "Removed" })
                          : t("room.vacant", { defaultValue: "Vacant" })}
                      </Text>
                      {bed.occupant?.admission_number ? (
                        <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
                          #{bed.occupant.admission_number}
                        </Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
