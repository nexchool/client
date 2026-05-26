import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/common/theme";
import { EmptyState } from "@/common/components/EmptyState";
import { Link } from "@/common/components/Link";
import { Skeleton } from "@/common/components/Skeleton";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/modules/notifications/hooks/useNotifications";
import { getNotificationEntityHref } from "@/modules/notifications/pushNavigation";
import { canOpenFinanceDeepLinks } from "@/modules/notifications/financeDeepLinkAccess";
import { stripHtmlToPlainText } from "@/modules/notifications/formatNotificationBody";
import type { AppNotification } from "@/modules/notifications/types";

type Filter = "all" | "unread";

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationsListScreen() {
  const { t } = useTranslation("notifications");
  const router = useRouter();
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const { isFeatureEnabled, hasAnyPermission } = useAuth();
  const canUse = isFeatureEnabled("notifications");
  const canFinanceDeepLink = canOpenFinanceDeepLinks(isFeatureEnabled, hasAnyPermission);

  const [filter, setFilter] = useState<Filter>("all");
  const listQuery = useNotificationsList(filter === "unread");
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items: AppNotification[] = useMemo(
    () => listQuery.data ?? [],
    [listQuery.data]
  );

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.read_at);
    return items;
  }, [items, filter]);

  const hasUnread = items.some((n) => !n.read_at);

  const onPressItem = useCallback(
    (item: AppNotification) => {
      const entityHref = getNotificationEntityHref(
        item.type,
        item.extra_data,
        canFinanceDeepLink
      );
      if (entityHref) {
        if (!item.read_at) {
          markRead.mutate(item.id);
        }
        router.push(entityHref as never);
        return;
      }
      router.push(`/(protected)/notifications/${item.id}` as never);
    },
    [canFinanceDeepLink, markRead, router]
  );

  if (!canUse) {
    return (
      <View
        style={{
          flex: 1,
          padding: spacing.marginMobile,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
          {t("unavailable", { defaultValue: "Notifications are unavailable." })}
        </Text>
      </View>
    );
  }

  const isInitialLoading = listQuery.isLoading && items.length === 0;

  return (
    <View style={{ flex: 1, padding: spacing.marginMobile, gap: spacing.lg }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={[typography.display, { color: palette.onSurface }]}>
          {t("title", { defaultValue: "Notifications" })}
        </Text>
        {hasUnread ? (
          <Link onPress={() => markAll.mutate()}>
            {markAll.isPending
              ? t("markingAll", { defaultValue: "Marking…" })
              : t("markAllRead", { defaultValue: "Mark all read" })}
          </Link>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {(["all", "unread"] as Filter[]).map((f) => {
          const isActive = filter === f;
          return (
            <Text
              key={f}
              onPress={() => setFilter(f)}
              style={[
                typography.labelMd,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: isActive
                    ? palette.primaryContainer
                    : palette.surfaceContainerLowest,
                  color: isActive ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                  overflow: "hidden",
                  fontFamily: isActive ? "Inter_600SemiBold" : "Inter_500Medium",
                },
              ]}
            >
              {t(`filter.${f}`, { defaultValue: f[0].toUpperCase() + f.slice(1) })}
            </Text>
          );
        })}
      </View>

      {isInitialLoading ? (
        <View style={{ gap: spacing.sm }}>
          <Skeleton width="100%" height={72} radius={radius.lg} />
          <Skeleton width="100%" height={72} radius={radius.lg} />
          <Skeleton width="100%" height={72} radius={radius.lg} />
        </View>
      ) : listQuery.error ? (
        <EmptyState
          icon={<Ionicons name="alert-circle-outline" size={36} color={palette.error} />}
          title={t("loadError", { defaultValue: "Could not load notifications" })}
          action={{
            label: t("retry", { defaultValue: "Retry" }),
            onPress: () => listQuery.refetch(),
          }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NotifRow
              item={item}
              isLast={index === filtered.length - 1}
              onPress={onPressItem}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="mail-open-outline" size={36} color={palette.onSurfaceVariant} />}
              title={t("empty.title", {
                defaultValue: "You're all caught up",
              })}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={!!listQuery.isRefetching}
              onRefresh={() => listQuery.refetch()}
            />
          }
          contentContainerStyle={
            filtered.length > 0
              ? [
                  elevation.card,
                  {
                    backgroundColor: palette.surfaceContainerLowest,
                    borderRadius: radius.xl,
                    overflow: "hidden" as const,
                  },
                ]
              : { paddingTop: spacing.lg }
          }
          ItemSeparatorComponent={() => null}
        />
      )}
    </View>
  );
}

function NotifRow({
  item,
  isLast,
  onPress,
}: {
  item: AppNotification;
  isLast: boolean;
  onPress: (item: AppNotification) => void;
}) {
  const { palette, spacing, typography } = useTheme();
  const isUnread = !item.read_at;
  const preview = stripHtmlToPlainText(item.body);
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? palette.surfaceContainer : "transparent",
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          padding: spacing.md,
          gap: spacing.md,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: palette.surfaceContainerHigh,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.secondaryContainer,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={isUnread ? "notifications" : "notifications-outline"}
            size={20}
            color={palette.onSecondaryContainer}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.labelMd,
              {
                color: palette.onSurface,
                fontFamily: isUnread ? "Inter_600SemiBold" : "Inter_500Medium",
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {preview ? (
            <Text
              style={[
                typography.bodyMd,
                { color: palette.onSurfaceVariant, marginTop: 2 },
              ]}
              numberOfLines={2}
            >
              {preview}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          {item.created_at ? (
            <Text style={[typography.labelSm, { color: palette.outline }]}>
              {relativeTime(item.created_at)}
            </Text>
          ) : null}
          {isUnread ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: palette.primary,
              }}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
