import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, SectionList, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
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
import { NotificationRow } from "@/modules/notifications/components/NotificationRow";
import {
  NotificationFilterChips,
  type StatusFilter,
} from "@/modules/notifications/components/NotificationFilterChips";
import {
  bucketByDate,
  filterByCategory,
  type NotificationCategory,
} from "@/modules/notifications/utils/notificationGrouping";
import type { AppNotification } from "@/modules/notifications/types";

export default function NotificationsListScreen() {
  const { t } = useTranslation("notifications");
  const router = useRouter();
  const { spacing, radius } = useTheme();
  const { isFeatureEnabled, hasAnyPermission } = useAuth();
  const canUse = isFeatureEnabled("notifications");
  const canFinanceDeepLink = canOpenFinanceDeepLinks(isFeatureEnabled, hasAnyPermission);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<NotificationCategory>("all");
  const listQuery = useNotificationsList(status === "unread");
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items: AppNotification[] = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const sections = useMemo(() => {
    const byCategory = filterByCategory(items, category);
    const byStatus = status === "unread" ? byCategory.filter((n) => !n.read_at) : byCategory;
    return bucketByDate(byStatus);
  }, [items, category, status]);

  const hasUnread = items.some((n) => !n.read_at);

  const onPressItem = useCallback(
    (item: AppNotification) => {
      const entityHref = getNotificationEntityHref(item.type, item.extra_data, canFinanceDeepLink);
      if (entityHref) {
        if (!item.read_at) markRead.mutate(item.id);
        router.push(entityHref as never);
        return;
      }
      router.push(`/(protected)/notifications/${item.id}` as never);
    },
    [canFinanceDeepLink, markRead, router],
  );

  if (!canUse) {
    return (
      <View style={{ flex: 1, padding: spacing.marginMobile, alignItems: "center", justifyContent: "center" }}>
        <Text variant="bodyMd" color="onSurfaceVariant">
          {t("unavailable", { defaultValue: "Notifications are unavailable." })}
        </Text>
      </View>
    );
  }

  const isInitialLoading = listQuery.isLoading && items.length === 0;

  return (
    <View style={{ flex: 1, padding: spacing.marginMobile, gap: spacing.lg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="display" color="onSurface">
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

      <NotificationFilterChips
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
      />

      {isInitialLoading ? (
        <View style={{ gap: spacing.sm }}>
          <Skeleton width="100%" height={72} radius={radius.lg} />
          <Skeleton width="100%" height={72} radius={radius.lg} />
          <Skeleton width="100%" height={72} radius={radius.lg} />
        </View>
      ) : listQuery.error ? (
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
          title={t("loadError", { defaultValue: "Could not load notifications" })}
          action={{ label: t("retry", { defaultValue: "Retry" }), onPress: () => listQuery.refetch() }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section, index }) => (
            <NotificationRow
              item={item}
              isLast={index === section.data.length - 1}
              onPress={onPressItem}
              onMarkRead={(id) => markRead.mutate(id)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text
              variant="labelMd"
              color="onSurfaceVariant"
              style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}
            >
              {t(`section.${section.key}`, {
                defaultValue:
                  section.key === "today" ? "Today" : section.key === "yesterday" ? "Yesterday" : "Earlier",
              })}
            </Text>
          )}
          renderSectionFooter={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon={<AppIcon name="mail-open-outline" size="xl" color="onSurfaceVariant" />}
              title={t("empty.title", { defaultValue: "You're all caught up" })}
            />
          }
          refreshControl={
            <RefreshControl refreshing={!!listQuery.isRefetching} onRefresh={() => listQuery.refetch()} />
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
        />
      )}
    </View>
  );
}
