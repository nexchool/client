import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, FlatList, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { BackHeader } from "@/common/components/BackHeader";
import { formatDate } from "@/common/utils/datetime";
import { useHostelAllocations, useHostels } from "../hooks/useHostelAdmin";
import type { HostelAllocation } from "../adminTypes";

export function HostelResidentsScreen() {
  const { t } = useTranslation("hostel");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: rows = [], isLoading, error, refetch, isRefetching } = useHostelAllocations({
    status: "active",
  });
  const { data: hostels = [] } = useHostels();
  const [query, setQuery] = useState("");

  const hostelName = useMemo(() => {
    const map = new Map(hostels.map((h) => [h.id, h.name]));
    return (id: string) => map.get(id) ?? "";
  }, [hostels]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((a) => {
      const name = (a.student_name ?? "").toLowerCase();
      const adm = (a.admission_number ?? "").toLowerCase();
      const hostel = hostelName(a.hostel_id).toLowerCase();
      return name.includes(q) || adm.includes(q) || hostel.includes(q);
    });
  }, [rows, query, hostelName]);

  const renderItem = ({ item: a }: { item: HostelAllocation }) => (
    <View
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
          width: 44,
          height: 44,
          borderRadius: radius.full,
          backgroundColor: palette.primaryContainer,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <AppIcon name="person" size="md" color="onPrimaryContainer" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelMd" color="onSurface" numberOfLines={1}>
          {a.student_name || t("common.unnamed", { defaultValue: "Unnamed" })}
        </Text>
        <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
          {a.admission_number ? `#${a.admission_number}` : ""}
          {hostelName(a.hostel_id) ? `${a.admission_number ? " · " : ""}${hostelName(a.hostel_id)}` : ""}
        </Text>
      </View>
      <Text variant="labelSm" color="onSurfaceVariant">
        {formatDate(a.check_in_at)}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader title={t("residents.title", { defaultValue: "Residents" })} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: palette.outlineVariant,
            paddingHorizontal: spacing.md,
            height: 48,
          }}
        >
          <AppIcon name="search-outline" size="md" color="onSurfaceVariant" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("residents.search", { defaultValue: "Search student or hostel" })}
            placeholderTextColor={palette.outline}
            style={{ flex: 1, color: palette.onSurface, paddingVertical: 0 }}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query ? <AppIcon name="close-circle" size="md" color="onSurfaceVariant" onPress={() => setQuery("")} /> : null}
        </View>
      </View>

      {error ? (
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
          title={t("common.failedToLoad", { defaultValue: "Failed to load" })}
          description={error instanceof Error ? error.message : undefined}
          action={{ label: t("common.tryAgain", { defaultValue: "Try again" }), onPress: () => refetch() }}
        />
      ) : isLoading && rows.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.xs, gap: spacing.md }}>
          <Skeleton width="100%" height={72} radius={radius.xl} />
          <Skeleton width="100%" height={72} radius={radius.xl} />
          <Skeleton width="100%" height={72} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.xs,
            paddingBottom: spacing.scrollBottom,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={<AppIcon name="people-outline" size="xl" color="onSurfaceVariant" />}
              title={
                query
                  ? t("residents.noMatch", { defaultValue: "No matches" })
                  : t("residents.emptyTitle", { defaultValue: "No residents" })
              }
              description={
                query
                  ? t("residents.noMatchHint", { defaultValue: "Try a different search." })
                  : t("residents.emptyHint", { defaultValue: "Allocated students will appear here." })
              }
            />
          }
        />
      )}
    </View>
  );
}
