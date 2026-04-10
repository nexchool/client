import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import {
  useMarkNotificationRead,
  useNotificationsList,
} from "@/modules/notifications/hooks/useNotifications";
import { getNotificationEntityHref } from "@/modules/notifications/pushNavigation";
import { canOpenFinanceDeepLinks } from "@/modules/notifications/financeDeepLinkAccess";
import { stripHtmlToPlainText } from "@/modules/notifications/formatNotificationBody";

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

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation("notifications");
  const { isFeatureEnabled, hasAnyPermission } = useAuth();
  const canUse = isFeatureEnabled("notifications");
  const canFinanceDeepLink = canOpenFinanceDeepLinks(isFeatureEnabled, hasAnyPermission);

  const { data, isLoading, refetch, isFetched } = useNotificationsList(false);
  const markRead = useMarkNotificationRead();

  const item = useMemo(
    () => data?.find((n) => n.id === id),
    [data, id]
  );

  useEffect(() => {
    void refetch();
  }, [id, refetch]);

  const markReadAttemptedForId = useRef<string | null>(null);
  useEffect(() => {
    markReadAttemptedForId.current = null;
  }, [id]);

  useEffect(() => {
    if (!item || item.read_at) return;
    if (markReadAttemptedForId.current === item.id) return;
    markReadAttemptedForId.current = item.id;
    markRead.mutate(item.id);
  }, [item, markRead]);

  const entityHref = item
    ? getNotificationEntityHref(item.type, item.extra_data, canFinanceDeepLink)
    : null;
  const bodyPlain = stripHtmlToPlainText(item?.body);

  if (!canUse) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{t("unavailable")}</Text>
      </View>
    );
  }

  if (isLoading && !item) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (isFetched && !item) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("detail.backA11y")}
          >
            <Ionicons name="chevron-back" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.muted}>{t("detail.notFound")}</Text>
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("detail.backA11y")}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {t("detail.title")}
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.detailTitle}>{item.title}</Text>
        <Text style={styles.meta}>
          {formatWhen(item.created_at, i18n.language)}
        </Text>
        {bodyPlain ? (
          <Text style={styles.body}>{bodyPlain}</Text>
        ) : (
          <Text style={styles.muted}>{t("detail.noBody")}</Text>
        )}

        {entityHref ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push(entityHref as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t("detail.openRelated")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: Layout.headerHeight,
  },
  backBtn: {
    padding: Spacing.xs,
    width: 44,
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
  },
  topBarSpacer: { width: 44 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  primaryBtn: {
    marginTop: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
});
