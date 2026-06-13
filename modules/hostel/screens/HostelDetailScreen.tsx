import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, SectionList, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { BackHeader } from "@/common/components/BackHeader";
import { callPhone } from "@/common/utils/phone";
import { useHostel, useHostelRooms } from "../hooks/useHostelAdmin";
import type { HostelRoom } from "../adminTypes";

export function HostelDetailScreen() {
  const { t } = useTranslation("hostel");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: hostel, isLoading, error } = useHostel(id);
  const { data: rooms = [], isLoading: roomsLoading, refetch, isRefetching } = useHostelRooms(id);

  const sections = useMemo(() => {
    const byFloor = new Map<string, HostelRoom[]>();
    for (const r of rooms) {
      const f = r.floor || t("buildings.noFloor", { defaultValue: "Unspecified" });
      const list = byFloor.get(f) ?? [];
      list.push(r);
      byFloor.set(f, list);
    }
    return [...byFloor.entries()].map(([title, data]) => ({ title, data }));
  }, [rooms, t]);

  const cardStyle = [
    elevation.card,
    { backgroundColor: palette.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.lg },
  ];

  if (error || (!hostel && !isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("buildings.detailTitle", { defaultValue: "Hostel" })} onBack={() => router.back()} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="onSurfaceVariant" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={t("buildings.notFound", { defaultValue: "This hostel could not be loaded." })}
        />
      </View>
    );
  }

  const header = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
      <View style={cardStyle}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <AppIcon name="business" size="lg" color="primary" />
          <View style={{ flex: 1 }}>
            <Text variant="headlineMd" color="onSurface" numberOfLines={1}>
              {hostel?.name}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant">
              {t("buildings.capacity", { defaultValue: "{{n}} beds", n: hostel?.capacity ?? 0 })}
            </Text>
          </View>
        </View>
        {hostel?.warden_name ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md }}>
            <AppIcon name="person-circle-outline" size="md" color="onSurfaceVariant" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" color="onSurface">{hostel.warden_name}</Text>
              <Text variant="labelSm" color="onSurfaceVariant">
                {t("buildings.warden", { defaultValue: "Warden" })}
                {hostel.warden_phone ? ` · ${hostel.warden_phone}` : ""}
              </Text>
            </View>
            {hostel.warden_phone ? (
              <PressScale
                onPress={() => callPhone(hostel.warden_phone)}
                style={{ padding: spacing.sm, backgroundColor: palette.primaryContainer, borderRadius: radius.full }}
              >
                <AppIcon name="call" size="md" color="onPrimaryContainer" />
              </PressScale>
            ) : null}
          </View>
        ) : null}
        {hostel?.address ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm }}>
            <AppIcon name="location-outline" size="md" color="onSurfaceVariant" />
            <Text variant="bodySm" color="onSurfaceVariant" style={{ flex: 1 }}>
              {hostel.address}
            </Text>
          </View>
        ) : null}
      </View>

      <Text variant="headlineMd" color="onSurface">
        {t("buildings.rooms", { defaultValue: "Rooms" })}
      </Text>
      {roomsLoading && rooms.length === 0 ? (
        <Skeleton width="100%" height={64} radius={radius.xl} />
      ) : null}
    </View>
  );

  const renderRoom = ({ item: r }: { item: HostelRoom }) => (
    <PressScale
      onPress={() => router.push(`/(protected)/hostel/rooms/${r.id}` as never)}
      style={[
        elevation.card,
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: palette.secondaryContainer,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <AppIcon name="bed-outline" size="md" color="onSecondaryContainer" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelMd" color="onSurface">
          {t("buildings.room", { defaultValue: "Room {{n}}", n: r.room_number })}
        </Text>
        <Text variant="labelSm" color="onSurfaceVariant">
          {t("buildings.beds", { defaultValue: "{{n}} beds", n: r.capacity })}
        </Text>
      </View>
      <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
    </PressScale>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader
        title={hostel?.name ?? t("buildings.detailTitle", { defaultValue: "Hostel" })}
        onBack={() => router.back()}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <Text variant="labelLg" color="onSurfaceVariant" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
            {section.title}
          </Text>
        )}
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.md,
          paddingBottom: spacing.scrollBottom,
        }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          !roomsLoading ? (
            <EmptyState
              icon={<AppIcon name="bed-outline" size="xl" color="onSurfaceVariant" />}
              title={t("buildings.noRooms", { defaultValue: "No rooms" })}
              description={t("buildings.noRoomsHint", { defaultValue: "Rooms in this hostel will appear here." })}
            />
          ) : null
        }
      />
    </View>
  );
}
