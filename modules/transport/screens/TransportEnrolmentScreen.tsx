import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, FlatList, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { formatCurrency } from "@/common/utils/formatCurrency";
import { TransportHeader } from "../components/TransportHeader";
import { useTransportEnrollments } from "../hooks/useTransportAdmin";
import type { TransportEnrollment, TransportEnrollmentDerivedStatus } from "../adminTypes";

/** Derived transport status → accent token + label key. */
function statusMeta(status: TransportEnrollmentDerivedStatus | null | undefined): {
  tone: keyof Palette;
  key: string;
  fallback: string;
} {
  switch (status) {
    case "route_inactive":
      return { tone: "error", key: "enrolment.statusRouteInactive", fallback: "Route inactive" };
    case "schedule_missing":
      return { tone: "warning", key: "enrolment.statusNoSchedule", fallback: "No schedule" };
    default:
      return { tone: "success", key: "enrolment.statusActive", fallback: "Active" };
  }
}

export function TransportEnrolmentScreen() {
  const { t } = useTranslation("transport");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { data: rows = [], isLoading, error, refetch, isRefetching } = useTransportEnrollments();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((e) => {
      const name = (e.student_name ?? "").toLowerCase();
      const adm = (e.admission_number ?? "").toLowerCase();
      const route = (e.route?.name ?? "").toLowerCase();
      const bus = (e.bus?.bus_number ?? "").toLowerCase();
      return name.includes(q) || adm.includes(q) || route.includes(q) || bus.includes(q);
    });
  }, [rows, query]);

  const renderItem = ({ item: e }: { item: TransportEnrollment }) => {
    const meta = statusMeta(e.transport_status);
    return (
      <View
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
              {e.student_name || t("enrolment.unnamed", { defaultValue: "Unnamed" })}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
              {e.admission_number ? `#${e.admission_number}` : ""}
              {e.route?.name ? `${e.admission_number ? " · " : ""}${e.route.name}` : ""}
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppIcon name="bus-outline" size="sm" color="onSurfaceVariant" />
            <Text variant="labelSm" color="onSurfaceVariant">
              {e.bus?.bus_number || t("enrolment.noBus", { defaultValue: "No bus" })}
            </Text>
          </View>
          {e.pickup_point ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 }}>
              <AppIcon name="location-outline" size="sm" color="onSurfaceVariant" />
              <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ flex: 1 }}>
                {e.pickup_point}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <Text variant="labelMd" color="onSurface">
            {formatCurrency(e.monthly_fee)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <TransportHeader title={t("enrolment.title", { defaultValue: "Enrolment" })} onBack={() => router.back()} />

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
            placeholder={t("enrolment.search", { defaultValue: "Search student, route or bus" })}
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
          <Skeleton width="100%" height={88} radius={radius.xl} />
          <Skeleton width="100%" height={88} radius={radius.xl} />
          <Skeleton width="100%" height={88} radius={radius.xl} />
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
              icon={<AppIcon name="school-outline" size="xl" color="onSurfaceVariant" />}
              title={
                query
                  ? t("enrolment.noMatch", { defaultValue: "No matches" })
                  : t("enrolment.emptyTitle", { defaultValue: "No enrolments" })
              }
              description={
                query
                  ? t("enrolment.noMatchHint", { defaultValue: "Try a different search." })
                  : t("enrolment.emptyHint", { defaultValue: "Students riding the buses will appear here." })
              }
            />
          }
        />
      )}
    </View>
  );
}
