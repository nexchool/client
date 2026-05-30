import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { ProfileActionRow } from "@/modules/profile/components/ProfileActionRow";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { setAppLanguage, getAppLanguage, type SupportedLanguage } from "@/i18n";
import {
  getPushNotificationsPreference,
  setPushNotificationsPreference,
} from "@/common/utils/storage";
import {
  registerDeviceForPushNotifications,
  unregisterDevicePushNotifications,
} from "@/modules/devices/pushRegistration";

const LANGUAGE_OPTIONS: {
  code: SupportedLanguage;
  labelKey: "language.english" | "language.gujarati" | "language.hindi";
}[] = [
  { code: "en", labelKey: "language.english" },
  { code: "gu", labelKey: "language.gujarati" },
  { code: "hi", labelKey: "language.hindi" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { palette, spacing } = useTheme();
  const { t } = useTranslation(["navigation", "settings", "common", "profile"]);
  const { logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);

  const current = getAppLanguage();

  useEffect(() => {
    void getPushNotificationsPreference().then(setPushEnabled);
  }, []);

  const currentLabel = useMemo(() => {
    const opt = LANGUAGE_OPTIONS.find((o) => o.code === current);
    return opt ? t(`settings:${opt.labelKey}`) : "";
  }, [current, t]);

  const selectLanguage = useCallback(async (lng: SupportedLanguage) => {
    if (lng === getAppLanguage()) {
      setDropdownOpen(false);
      return;
    }
    setPending(true);
    try {
      await setAppLanguage(lng);
      setDropdownOpen(false);
    } finally {
      setPending(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(protected)/home");
    }
  }, [router]);

  const onPushToggle = useCallback(
    async (value: boolean) => {
      if (pushBusy) return;
      setPushBusy(true);
      try {
        await setPushNotificationsPreference(value);
        setPushEnabled(value);
        if (value) {
          await registerDeviceForPushNotifications();
        } else {
          await unregisterDevicePushNotifications();
        }
      } finally {
        setPushBusy(false);
      }
    },
    [pushBusy],
  );

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("profile:logoutConfirm.title", { defaultValue: "Sign out" }),
      t("profile:logoutConfirm.message", {
        defaultValue: "Are you sure you want to sign out?",
      }),
      [
        {
          text: t("profile:logoutConfirm.cancel", { defaultValue: "Cancel" }),
          style: "cancel",
        },
        {
          text: t("profile:logoutConfirm.confirm", { defaultValue: "Sign out" }),
          style: "destructive",
          onPress: () => {
            void logout();
          },
        },
      ],
    );
  }, [logout, t]);

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomColor: palette.outlineVariant,
          },
        ]}
      >
        <AppIcon
          name="arrow-back"
          size="lg"
          color="onSurface"
          onPress={handleBack}
          accessibilityLabel={t("common:back")}
          style={{ marginRight: spacing.sm }}
        />
        <Text variant="headlineLg" color="onSurface" style={{ flex: 1 }}>
          {t("navigation:tabs.settings")}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xl,
          gap: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ACCOUNT */}
        <Text
          variant="overline"
          color="primary"
          style={{ marginBottom: spacing.xs, marginLeft: spacing.xs }}
        >
          {t("settings:sections.account")}
        </Text>
        <ProfileActionRow
          icon="person-outline"
          label={t("settings:rows.personalInfo")}
          hint={t("settings:rows.personalInfoSubtitle")}
          onPress={() => router.push("/(protected)/profile" as never)}
        />
        <ProfileActionRow
          icon="shield-outline"
          label={t("settings:rows.security")}
          hint={t("settings:rows.securitySubtitle")}
          onPress={() =>
            router.push("/(protected)/profile/change-password" as never)
          }
        />

        {/* PREFERENCES */}
        <Text
          variant="overline"
          color="primary"
          style={{
            marginTop: spacing.md,
            marginBottom: spacing.xs,
            marginLeft: spacing.xs,
          }}
        >
          {t("settings:sections.preferences")}
        </Text>
        <ProfileActionRow
          icon="notifications-outline"
          label={t("settings:pushSectionTitle")}
          hint={t("settings:pushSectionSubtitle")}
          trailing={
            pushBusy ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <Switch
                value={pushEnabled}
                onValueChange={(v) => void onPushToggle(v)}
                trackColor={{
                  false: palette.outlineVariant,
                  true: palette.primary,
                }}
                thumbColor={palette.surfaceContainerLowest}
                disabled={pushBusy}
                accessibilityLabel={t("settings:pushSectionTitle")}
              />
            )
          }
        />
        <ProfileActionRow
          icon="language-outline"
          label={t("settings:languageSectionTitle")}
          hint={currentLabel}
          onPress={() => !pending && setDropdownOpen(true)}
          trailing={
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              {pending ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : null}
              <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
            </View>
          }
        />
        {!Device.isDevice ? (
          <Text
            variant="labelSm"
            color="onSurfaceVariant"
            style={{ marginLeft: spacing.xs, marginTop: spacing.xs }}
          >
            {t("settings:pushSimulatorHint")}
          </Text>
        ) : null}

        {/* APP */}
        <Text
          variant="overline"
          color="primary"
          style={{
            marginTop: spacing.md,
            marginBottom: spacing.xs,
            marginLeft: spacing.xs,
          }}
        >
          {t("settings:sections.app")}
        </Text>
        <ProfileActionRow
          icon="help-circle-outline"
          label={t("settings:rows.helpSupport")}
          onPress={() => router.push("/(protected)/help-support" as never)}
        />
        <ProfileActionRow
          icon="log-out-outline"
          label={t("profile:main.logout")}
          destructive
          trailing={null}
          onPress={handleLogout}
        />
      </ScrollView>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: "rgba(11, 28, 48, 0.40)" }]}
          onPress={() => setDropdownOpen(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: palette.surfaceContainerLowest,
                paddingBottom: spacing.xs,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              variant="labelSm"
              color="onSurfaceVariant"
              style={{
                paddingHorizontal: spacing.md,
                paddingTop: spacing.md,
                paddingBottom: spacing.sm,
              }}
            >
              {t("settings:languageSectionTitle")}
            </Text>
            <View
              style={[styles.modalDivider, { backgroundColor: palette.outlineVariant }]}
            />
            {LANGUAGE_OPTIONS.map(({ code, labelKey }, index) => {
              const selected = current === code;
              const isLast = index === LANGUAGE_OPTIONS.length - 1;
              return (
                <Pressable
                  key={code}
                  style={[
                    styles.modalOption,
                    { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: palette.outlineVariant,
                    },
                  ]}
                  onPress={() => void selectLanguage(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    variant="bodyMd"
                    color={selected ? "primary" : "onSurface"}
                    style={{ flex: 1 }}
                  >
                    {t(`settings:${labelKey}`)}
                  </Text>
                  {selected ? (
                    <AppIcon name="checkmark" size="md" color="primary" />
                  ) : (
                    <View style={styles.modalOptionSpacer} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  scroll: { flex: 1 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalOptionSpacer: { width: 20, height: 20 },
});
