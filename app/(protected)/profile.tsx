import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { useRouter } from "expo-router";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { Ionicons } from "@expo/vector-icons";
import { Protected } from "@/modules/permissions/components/Protected";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import * as PERMS from "@/modules/permissions/constants/permissions";

const TERMS_URL = "https://nexchool.in/terms";
const PRIVACY_URL = "https://nexchool.in/privacy";

export default function ProfileScreen() {
  const { t } = useTranslation(["profile", "navigation"]);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { role: userRole } = useUiRole();
  const roleLabel = t(`navigation:roles.${userRole.toLowerCase()}`, {
    defaultValue: userRole,
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <ProfileAvatar
              uri={user?.profile_picture_url}
              size={88}
              name={user?.name ?? user?.email ?? undefined}
              iconName="person"
              iconColor={Colors.primary}
              placeholderBg={Colors.background}
            />
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.email?.split("@")[0]}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("profile:main.sections.profileInformation")}
          </Text>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => router.push("/(protected)/my-profile" as never)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {t("profile:main.cards.myProfile")}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {t("profile:main.cards.myProfileSubtitle")}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <Protected
            anyPermissions={[
              PERMS.PROFILE_READ_SELF,
              PERMS.PROFILE_UPDATE_SELF,
            ]}
          >
            <TouchableOpacity style={styles.infoCard}>
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name="shield-outline"
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>
                    {t("profile:main.cards.changePassword")}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {t("profile:main.cards.changePasswordSubtitle")}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </Protected>
        </View>

        {/* Academic Info - Student/Parent */}
        <Protected
          anyPermissions={[PERMS.GRADE_READ_SELF, PERMS.GRADE_READ_CHILD]}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("profile:main.sections.academic")}
            </Text>

            <TouchableOpacity style={styles.infoCard}>
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>
                    {t("profile:main.cards.reportCard")}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {t("profile:main.cards.reportCardSubtitle")}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </Protected>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("profile:main.sections.settings")}
          </Text>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {t("profile:main.cards.notifications")}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {t("profile:main.cards.notificationsSubtitle")}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => router.push("/(protected)/help-support" as never)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {t("profile:main.cards.helpSupport")}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {t("profile:main.cards.helpSupportSubtitle")}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => void Linking.openURL(TERMS_URL)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {t("profile:main.cards.terms")}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {t("profile:main.cards.termsSubtitle")}
                </Text>
              </View>
            </View>
            <Ionicons
              name="open-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => void Linking.openURL(PRIVACY_URL)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {t("profile:main.cards.privacy")}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {t("profile:main.cards.privacySubtitle")}
                </Text>
              </View>
            </View>
            <Ionicons
              name="open-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
            <Text style={styles.logoutText}>{t("profile:main.logout")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.lg,
  },
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomLeftRadius: Spacing.xl,
    borderBottomRightRadius: Spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  roleBadge: {
    position: "absolute",
    bottom: 0,
    right: -8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.background,
    fontFamily: "System",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontFamily: "System",
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "System",
  },
  content: {
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
    fontFamily: "System",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
    fontFamily: "System",
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "System",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
    marginLeft: Spacing.sm,
    fontFamily: "System",
  },
});
