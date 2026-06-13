import React, { useState } from "react";
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
import { FilterChips } from "@/common/components/FilterChips";
import { formatDateTime } from "@/common/utils/datetime";
import { useHostelGatepasses } from "../hooks/useHostelAdmin";
import { gatepassStatusMeta, gatepassTypeMeta } from "../utils/gatepass";
import type { HostelGatepass, GatepassStatus } from "../adminTypes";

const FILTERS: { key: GatepassStatus | undefined; labelKey: string; fallback: string }[] = [
  { key: undefined, labelKey: "gatepass.filterAll", fallback: "All" },
  { key: "pending", labelKey: "gatepass.filterPending", fallback: "Pending" },
  { key: "active", labelKey: "gatepass.filterOut", fallback: "Out" },
  { key: "overdue", labelKey: "gatepass.filterOverdue", fallback: "Overdue" },
];

export function HostelGatepassesScreen() {
  const { t } = useTranslation("hostel");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const [status, setStatus] = useState<GatepassStatus | undefined>(undefined);
  const { data: rows = [], isLoading, error, refetch, isRefetching } = useHostelGatepasses(
    status ? { status } : undefined
  );

  const renderItem = ({ item: gp }: { item: HostelGatepass }) => {
    const meta = gatepassStatusMeta(gp.status);
    const typeMeta = gatepassTypeMeta(gp.type);
    return (
      <PressScale
        onPress={() => router.push(`/(protected)/hostel/gatepasses/${gp.id}` as never)}
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
          <View style={{ flex: 1 }}>
            <Text variant="labelMd" color="onSurface" numberOfLines={1}>
              {gp.student_name || t("common.unnamed", { defaultValue: "Unnamed" })}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
              {t(typeMeta.key, { defaultValue: typeMeta.fallback })}
              {gp.admission_number ? ` · #${gp.admission_number}` : ""}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: radius.full,
              backgroundColor: palette.surfaceContainerHigh,
            }}
          >
            <Text variant="labelSm" color={meta.tone}>
              {t(meta.key, { defaultValue: meta.fallback })}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm }}>
          <AppIcon name="time-outline" size="sm" color="onSurfaceVariant" />
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
            {t("gatepass.returnBy", { defaultValue: "Return by" })} {formatDateTime(gp.expected_return_datetime)}
          </Text>
        </View>
      </PressScale>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader title={t("gatepass.title", { defaultValue: "Gate passes" })} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.sm }}>
        <FilterChips
          options={FILTERS.map((f) => ({
            value: f.key ?? "all",
            label: t(f.labelKey, { defaultValue: f.fallback }),
          }))}
          value={status ?? "all"}
          onChange={(v) => setStatus(v === "all" ? undefined : (v as GatepassStatus))}
        />
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
          <Skeleton width="100%" height={84} radius={radius.xl} />
          <Skeleton width="100%" height={84} radius={radius.xl} />
          <Skeleton width="100%" height={84} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.xs,
            paddingBottom: spacing.xl * 2,
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={<AppIcon name="exit-outline" size="xl" color="onSurfaceVariant" />}
              title={t("gatepass.emptyTitle", { defaultValue: "No gate passes" })}
              description={t("gatepass.emptyHint", { defaultValue: "Gate passes will appear here." })}
            />
          }
        />
      )}
    </View>
  );
}
