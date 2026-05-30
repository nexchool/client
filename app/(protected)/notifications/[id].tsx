import React, { useEffect, useMemo, useRef } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
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
  const { palette, spacing, radius, touchTarget } = useTheme();
  const { isFeatureEnabled, hasAnyPermission } = useAuth();
  const canUse = isFeatureEnabled("notifications");
  const canFinanceDeepLink = canOpenFinanceDeepLinks(isFeatureEnabled, hasAnyPermission);

  const { data, isLoading, refetch, isFetched } = useNotificationsList(false);
  const markRead = useMarkNotificationRead();

  const item = useMemo(() => data?.find((n) => n.id === id), [data, id]);

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

  const centered = {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: spacing.xl,
  };

  if (!canUse) {
    return (
      <View style={centered}>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ textAlign: "center" }}>
          {t("unavailable")}
        </Text>
      </View>
    );
  }

  if (isLoading && !item) {
    return (
      <View style={centered}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const topBar = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: palette.outlineVariant,
        minHeight: touchTarget.min + spacing.sm,
      }}
    >
      <View style={{ width: touchTarget.min }}>
        <AppIcon
          name="chevron-back"
          size="lg"
          color="onSurface"
          onPress={() => router.back()}
          accessibilityLabel={t("detail.backA11y")}
        />
      </View>
      <Text
        variant="titleSm"
        color="onSurface"
        numberOfLines={1}
        style={{ flex: 1, textAlign: "center" }}
      >
        {t("detail.title")}
      </Text>
      <View style={{ width: touchTarget.min }} />
    </View>
  );

  if (isFetched && !item) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        {topBar}
        <View style={centered}>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ textAlign: "center" }}>
            {t("detail.notFound")}
          </Text>
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={centered}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      {topBar}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.xl + spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
          {item.title}
        </Text>
        <Text variant="bodySm" color="onSurfaceVariant" style={{ marginBottom: spacing.lg }}>
          {formatWhen(item.created_at, i18n.language)}
        </Text>
        {bodyPlain ? (
          <Text variant="bodyMd" color="onSurface">
            {bodyPlain}
          </Text>
        ) : (
          <Text variant="bodyMd" color="onSurfaceVariant">
            {t("detail.noBody")}
          </Text>
        )}

        {entityHref ? (
          <PressScale
            onPress={() => router.push(entityHref as never)}
            style={{
              marginTop: spacing.xl,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              backgroundColor: palette.primary,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.md,
            }}
          >
            <Text variant="labelLg" color="onPrimary">
              {t("detail.openRelated")}
            </Text>
            <AppIcon name="arrow-forward" size="sm" color="onPrimary" />
          </PressScale>
        ) : null}
      </ScrollView>
    </View>
  );
}
