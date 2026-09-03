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
import { callPhone } from "@/common/utils/phone";
import { formatDateTime } from "@/common/utils/datetime";
import { usePermissions } from "@/modules/permissions/hooks/usePermissions";
import { useHostelVisitorLogs, useVisitorCheckOut } from "../hooks/useHostelAdmin";
import { PERM_VISITOR_MANAGE } from "../utils/gatepass";
import type { HostelVisitorLog } from "../adminTypes";
import { useDialog, useToast } from "@/common/feedback";

export function HostelVisitorsScreen() {
  const { t } = useTranslation("hostel");
  const { confirm } = useDialog();
  const toast = useToast();
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const { hasPermission } = usePermissions();
  const [insideOnly, setInsideOnly] = useState(true);
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHostelVisitorLogs(insideOnly ? { open: true } : {});

  // "Inside now" is bounded and arrives in one page; the history is not.
  const rows = React.useMemo(
    () => data?.pages.flatMap((page) => page.visitor_logs) ?? [],
    [data]
  );
  const checkout = useVisitorCheckOut();
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = hasPermission(PERM_VISITOR_MANAGE);

  const doCheckout = async (log: HostelVisitorLog) => {
    const ok = await confirm({
      title: t("visitors.confirmTitle", { defaultValue: "Check out visitor" }),
      description: t("visitors.confirmCheckout", {
        defaultValue: "Mark {{name}} as left?",
        name: log.visitor_name || t("visitors.theVisitor", { defaultValue: "this visitor" }),
      }),
      confirmLabel: t("common.confirm", { defaultValue: "Confirm" }),
      cancelLabel: t("common.cancel", { defaultValue: "Cancel" }),
    });
    if (!ok) return;
    try {
      setBusyId(log.id);
      await checkout.mutateAsync(log.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.tryAgain", { defaultValue: "Try again" }));
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item: log }: { item: HostelVisitorLog }) => {
    const inside = !log.check_out_at;
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
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.full,
              backgroundColor: inside ? palette.secondaryContainer : palette.surfaceContainerHigh,
              alignItems: "center",
              justifyContent: "center",
              marginRight: spacing.md,
            }}
          >
            <AppIcon name="person" size="md" color={inside ? "onSecondaryContainer" : "onSurfaceVariant"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="labelMd" color="onSurface" numberOfLines={1}>
              {log.visitor_name || t("visitors.unknownVisitor", { defaultValue: "Visitor" })}
            </Text>
            <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
              {t("visitors.visiting", { defaultValue: "Visiting" })}{" "}
              {log.student_name || t("common.unnamed", { defaultValue: "a student" })}
              {log.purpose ? ` · ${log.purpose}` : ""}
            </Text>
          </View>
          {log.visitor_phone ? (
            <PressScale
              onPress={() => callPhone(log.visitor_phone)}
              style={{ padding: spacing.sm, backgroundColor: palette.primaryContainer, borderRadius: radius.full }}
            >
              <AppIcon name="call" size="sm" color="onPrimaryContainer" />
            </PressScale>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm }}>
          <AppIcon name={inside ? "enter-outline" : "exit-outline"} size="sm" color="onSurfaceVariant" />
          <Text variant="labelSm" color="onSurfaceVariant" style={{ flex: 1 }} numberOfLines={1}>
            {inside
              ? `${t("visitors.in", { defaultValue: "In" })} ${formatDateTime(log.check_in_at)}`
              : `${t("visitors.out", { defaultValue: "Out" })} ${formatDateTime(log.check_out_at)}`}
          </Text>
          {inside && canManage ? (
            <PressScale
              onPress={() => doCheckout(log)}
              disabled={busyId === log.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                backgroundColor: palette.primary,
                opacity: busyId === log.id ? 0.5 : 1,
              }}
            >
              <AppIcon name="log-out-outline" size="sm" color="onPrimary" />
              <Text variant="labelSm" color="onPrimary">
                {t("visitors.checkOut", { defaultValue: "Check out" })}
              </Text>
            </PressScale>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader title={t("visitors.title", { defaultValue: "Visitors" })} onBack={() => router.back()} />

      <View style={{ flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.sm }}>
        {[
          { v: true, key: "visitors.inside", fallback: "Inside now" },
          { v: false, key: "visitors.recent", fallback: "Recent" },
        ].map((opt) => {
          const active = opt.v === insideOnly;
          return (
            <PressScale
              key={String(opt.v)}
              onPress={() => setInsideOnly(opt.v)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: active ? palette.primary : palette.surfaceContainerLowest,
                borderWidth: active ? 0 : 1,
                borderColor: palette.outlineVariant,
              }}
            >
              <Text variant="labelMd" color={active ? "onPrimary" : "onSurfaceVariant"}>
                {t(opt.key, { defaultValue: opt.fallback })}
              </Text>
            </PressScale>
          );
        })}
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
          <Skeleton width="100%" height={92} radius={radius.xl} />
          <Skeleton width="100%" height={92} radius={radius.xl} />
          <Skeleton width="100%" height={92} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: spacing.xs,
            paddingBottom: spacing.scrollBottom,
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<AppIcon name="walk-outline" size="xl" color="onSurfaceVariant" />}
              title={
                insideOnly
                  ? t("visitors.noneInside", { defaultValue: "No visitors inside" })
                  : t("visitors.noneRecent", { defaultValue: "No recent visitors" })
              }
              description={t("visitors.emptyHint", { defaultValue: "Visitor check-ins will appear here." })}
            />
          }
        />
      )}
    </View>
  );
}
