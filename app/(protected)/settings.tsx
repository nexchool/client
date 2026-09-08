import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { LanguageSheet, currentLanguageLabel } from "@/common/components/LanguageSheet";
import { AppIcon } from "@/common/components/AppIcon";
import { PageHeader } from "@/common/components/PageHeader";
import { ProfileActionRow } from "@/modules/profile/components/ProfileActionRow";
import { BiometricUnlockRow } from "@/modules/auth/components/BiometricUnlockRow";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useDialog } from "@/common/feedback";
import {
  getPushNotificationsPreference,
  setPushNotificationsPreference,
} from "@/common/utils/storage";
import {
  registerDeviceForPushNotifications,
  unregisterDevicePushNotifications,
} from "@/modules/devices/pushRegistration";

export default function SettingsScreen() {
  const router = useRouter();
  const { palette, spacing } = useTheme();
  const { t } = useTranslation(["navigation", "settings", "common", "profile"]);
  const { confirm } = useDialog();
  const { logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);


  useEffect(() => {
    void getPushNotificationsPreference().then(setPushEnabled);
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

  const handleLogout = useCallback(async () => {
    const signOut = await confirm({
      title: t("profile:logoutConfirm.title", { defaultValue: "Sign out" }),
      description: t("profile:logoutConfirm.message", {
        defaultValue: "Are you sure you want to sign out?",
      }),
      tone: "danger",
      confirmLabel: t("profile:logoutConfirm.confirm", { defaultValue: "Sign out" }),
      cancelLabel: t("profile:logoutConfirm.cancel", { defaultValue: "Cancel" }),
    });
    if (signOut) void logout();
  }, [logout, t]);

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <PageHeader
        title={t("navigation:tabs.settings")}
        onBack={handleBack}
        backLabel={t("common:back")}
      />

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
        <BiometricUnlockRow />
        <ProfileActionRow
          icon="language-outline"
          label={t("settings:languageSectionTitle")}
          hint={currentLanguageLabel()}
          onPress={() => setDropdownOpen(true)}
          trailing={<AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />}
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

      <LanguageSheet
        visible={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
});
