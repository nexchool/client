import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing } from "@/common/constants/spacing";
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

function formatWhen(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function NotificationsListScreen() {
  const { t, i18n } = useTranslation("notifications");
  const router = useRouter();
  const { isFeatureEnabled, hasAnyPermission } = useAuth();
  const canUse = isFeatureEnabled("notifications");
  const canFinanceDeepLink = canOpenFinanceDeepLinks(isFeatureEnabled, hasAnyPermission);

  const { data, isLoading, isRefetching, refetch, error } = useNotificationsList(false);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

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
      <View style={styles.centered}>
        <Text style={styles.muted}>{t("unavailable")}</Text>
      </View>
    );
  }

  const list = data ?? [];
  const unreadCount = list.filter((n) => !n.read_at).length;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.title}>{t("title")}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}
            hitSlop={8}
          >
            <Text style={styles.markAll}>
              {markAll.isPending ? t("markingAll") : t("markAllRead")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{t("loadError")}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          contentContainerStyle={list.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={<Text style={styles.muted}>{t("empty")}</Text>}
          renderItem={({ item }) => {
            const preview = stripHtmlToPlainText(item.body);
            return (
              <TouchableOpacity
                style={[styles.row, !item.read_at && styles.rowUnread]}
                onPress={() => onPressItem(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIcon}>
                  <Ionicons
                    name={item.read_at ? "notifications-outline" : "notifications"}
                    size={22}
                    color={item.read_at ? Colors.textSecondary : Colors.primary}
                  />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {preview ? (
                    <Text style={styles.rowBodyText} numberOfLines={1}>
                      {preview}
                    </Text>
                  ) : null}
                  <Text style={styles.rowMeta}>
                    {formatWhen(item.created_at, i18n.language)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  markAll: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  rowUnread: {
    backgroundColor: Colors.primary + "0D",
  },
  rowIcon: { width: 32, alignItems: "center" },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  rowBodyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  rowMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  muted: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  error: {
    fontSize: 15,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  retryText: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
