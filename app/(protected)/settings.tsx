import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Linking,
} from "react-native";
import Constants from "expo-constants";
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
import {
  getPushNotificationsPreference,
  setPushNotificationsPreference,
} from "@/common/utils/storage";
import {
  registerDeviceForPushNotifications,
  unregisterDevicePushNotifications,
} from "@/modules/devices/pushRegistration";

const TERMS_URL = "https://nexchool.in/terms";
const PRIVACY_URL = "https://nexchool.in/privacy";

/**
 * How the app behaves on this phone, plus the app's own shelf.
 *
 * Deliberately holds nothing about the person signed in: no name, no password,
 * no sign out. Those live on the profile screen, which is where somebody looks
 * for them, and a second copy here is the reason the two screens used to read
 * as the same screen twice.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { palette, spacing } = useTheme();
  const { t } = useTranslation(["navigation", "settings", "common", "profile"]);

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

  const sectionHeading = (key: string, first = false) => (
    <Text
      variant="overline"
      color="primary"
      style={{
        marginTop: first ? 0 : spacing.md,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
      }}
    >
      {t(key)}
    </Text>
  );

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
          paddingBottom: spacing.scrollBottom,
          gap: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* PREFERENCES — everything that changes how this phone behaves. */}
        {sectionHeading("settings:sections.preferences", true)}
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
        {!Device.isDevice ? (
          <Text
            variant="labelSm"
            color="onSurfaceVariant"
            style={{ marginLeft: spacing.xs }}
          >
            {t("settings:pushSimulatorHint")}
          </Text>
        ) : null}
        <BiometricUnlockRow />
        <ProfileActionRow
          icon="language-outline"
          label={t("settings:languageSectionTitle")}
          hint={t("settings:languageSectionSubtitle")}
          onPress={() => setDropdownOpen(true)}
          trailing={
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
            >
              <Text variant="bodyMd" color="onSurfaceVariant">
                {currentLanguageLabel()}
              </Text>
              <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
            </View>
          }
        />

        {/* SUPPORT & LEGAL */}
        {sectionHeading("settings:sections.support")}
        <ProfileActionRow
          icon="help-circle-outline"
          label={t("profile:main.cards.helpSupport")}
          hint={t("profile:main.cards.helpSupportSubtitle")}
          onPress={() => router.push("/(protected)/help-support" as never)}
        />
        <ProfileActionRow
          icon="document-text-outline"
          label={t("profile:main.cards.terms")}
          hint={t("profile:main.cards.termsSubtitle")}
          onPress={() => void Linking.openURL(TERMS_URL)}
        />
        <ProfileActionRow
          icon="shield-checkmark-outline"
          label={t("profile:main.cards.privacy")}
          hint={t("profile:main.cards.privacySubtitle")}
          onPress={() => void Linking.openURL(PRIVACY_URL)}
        />

        {/* ABOUT */}
        {sectionHeading("settings:sections.about")}
        <ProfileActionRow
          icon="information-circle-outline"
          label={t("profile:about.version")}
          trailing={
            <Text variant="bodyMd" color="onSurfaceVariant">
              {Constants.expoConfig?.version ?? "—"}
            </Text>
          }
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
