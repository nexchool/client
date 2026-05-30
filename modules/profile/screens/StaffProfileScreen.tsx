import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Linking, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useTheme } from "@/common/theme";
import { DetailCard } from "@/common/components/DetailCard";
import { DetailRow } from "@/common/components/DetailRow";
import { Protected } from "@/modules/permissions/components/Protected";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import * as PERMS from "@/modules/permissions/constants/permissions";
import { ProfileHeroCard } from "@/modules/profile/components/ProfileHeroCard";
import { ProfileActionRow } from "@/modules/profile/components/ProfileActionRow";

const TERMS_URL = "https://nexchool.in/terms";
const PRIVACY_URL = "https://nexchool.in/privacy";

export default function StaffProfileScreen() {
  const { t } = useTranslation(["profile", "navigation"]);
  const router = useRouter();
  const { user, tenantName, logout, isFeatureEnabled } = useAuth();
  const { role: userRole } = useUiRole();
  const { spacing } = useTheme();

  const roleLabel = t(`navigation:roles.${userRole.toLowerCase()}`, {
    defaultValue: userRole,
  });

  const displayName =
    user?.name?.trim() || user?.email?.split("@")[0] || roleLabel;

  const subline = [roleLabel, tenantName].filter(Boolean).join(" · ");

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingHorizontal: spacing.marginMobile,
        paddingTop: spacing.lg,
        paddingBottom: spacing[40] * 2,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero — avatar + name + role · school. No Edit button: staff have no
          self-edit form; the full record opens via the "My profile" row below. */}
      <ProfileHeroCard
        avatarUri={user?.profile_picture_url}
        name={displayName}
        subline={subline}
      />

      {/* Contact Information — only fields that are genuinely on the staff
          user object (email + school). Phone/department aren't available here. */}
      <DetailCard
        title={t("profile:myProfile.sections.contact")}
        accent="secondary"
      >
        {user?.email ? (
          <DetailRow
            icon="mail-outline"
            label={t("profile:fields.email")}
            value={user.email}
          />
        ) : null}
        {tenantName ? (
          <DetailRow
            icon="business-outline"
            label={t("profile:fields.school", { defaultValue: "School" })}
            value={tenantName}
          />
        ) : null}
        <DetailRow
          icon="ribbon-outline"
          label={t("profile:fields.designation")}
          value={roleLabel}
        />
      </DetailCard>

      {/* Profile + security actions */}
      <ProfileActionRow
        icon="person-outline"
        label={t("profile:main.cards.myProfile")}
        hint={t("profile:main.cards.myProfileSubtitle")}
        onPress={() => router.push("/(protected)/my-profile" as never)}
      />

      <Protected
        anyPermissions={[PERMS.PROFILE_READ_SELF, PERMS.PROFILE_UPDATE_SELF]}
      >
        <ProfileActionRow
          icon="shield-outline"
          label={t("profile:main.cards.changePassword")}
          hint={t("profile:main.cards.changePasswordSubtitle")}
          onPress={() =>
            router.push("/(protected)/profile/change-password" as never)
          }
        />
      </Protected>

      {/* Academic — student/parent gated */}
      <Protected
        anyPermissions={[PERMS.GRADE_READ_SELF, PERMS.GRADE_READ_CHILD]}
      >
        <ProfileActionRow
          icon="document-text-outline"
          label={t("profile:main.cards.reportCard")}
          hint={t("profile:main.cards.reportCardSubtitle")}
        />
      </Protected>

      {/* Settings & preferences */}
      <ProfileActionRow
        icon="settings-outline"
        label={t("profile:main.cards.appSettings")}
        hint={t("profile:main.cards.appSettingsSubtitle")}
        onPress={() => router.push("/(protected)/settings" as never)}
      />

      {isFeatureEnabled("notifications") && (
        <ProfileActionRow
          icon="notifications-outline"
          label={t("profile:main.cards.notifications")}
          hint={t("profile:main.cards.notificationsSubtitle")}
          onPress={() => router.push("/(protected)/notifications" as never)}
        />
      )}

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
        trailing={null}
        onPress={() => void Linking.openURL(TERMS_URL)}
      />

      <ProfileActionRow
        icon="shield-checkmark-outline"
        label={t("profile:main.cards.privacy")}
        hint={t("profile:main.cards.privacySubtitle")}
        trailing={null}
        onPress={() => void Linking.openURL(PRIVACY_URL)}
      />

      {/* Sign out */}
      <ProfileActionRow
        icon="log-out-outline"
        label={t("profile:main.logout")}
        trailing={null}
        destructive
        onPress={handleLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
