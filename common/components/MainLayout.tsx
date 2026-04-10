import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { router, usePathname, Slot, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import SafeScreenWrapper from "@/common/components/SafeScreenWrapper";
import Sidebar from "@/common/components/Sidebar";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useAcademicYearContext } from "@/modules/academics/context/AcademicYearContext";
import { CreateAcademicYearModal } from "@/modules/academics/components/CreateAcademicYearModal";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import { useUnreadNotificationsBadge } from "@/modules/notifications/hooks/useNotifications";

/** Hide header profile shortcut when already on Profile or My profile screens. */
function shouldHideHeaderProfile(pathname: string | undefined): boolean {
  if (!pathname) return false;
  if (pathname.includes("my-profile")) return true;
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return last === "profile";
}

export default function MainLayout() {
  const { t } = useTranslation("common");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [createYearModalVisible, setCreateYearModalVisible] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, isFeatureEnabled } = useAuth();
  const { isAdmin } = useUiRole();
  const hideHeaderProfile = shouldHideHeaderProfile(pathname);
  const showNotifications = isFeatureEnabled("notifications");
  const unreadBadge = useUnreadNotificationsBadge(showNotifications);
  const unreadCount = unreadBadge.data?.length ?? 0;

  useFocusEffect(
    useCallback(() => {
      if (showNotifications) {
        void unreadBadge.refetch();
      }
    }, [showNotifications, unreadBadge.refetch])
  );
  const {
    selectedAcademicYearId,
    setSelectedAcademicYearId,
    academicYears,
    isLoading,
  } = useAcademicYearContext();
  const showYearPicker = isAdmin;

  const handleProfilePress = () => {
    setSidebarVisible(false);
    if (pathname?.includes("profile")) return;
    router.push("/(protected)/profile");
  };

  const selectedLabel =
    selectedAcademicYearId
      ? academicYears.find((ay) => ay.id === selectedAcademicYearId)?.name ?? t("academicYearPicker.select")
      : t("academicYearPicker.allYears");

  return (
    <SafeScreenWrapper backgroundColor={Colors.background}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={28} color={Colors.text} />
          </TouchableOpacity>

          {/* Global Academic Year Selector - Admin only */}
          {showYearPicker ? (
            <TouchableOpacity
              style={styles.yearSelector}
              onPress={() => setYearPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="school" size={18} color={Colors.textSecondary} />
              <Text style={styles.yearSelectorText} numberOfLines={1}>
                {isLoading ? "..." : selectedLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.yearSelectorPlaceholder} />
          )}

          <View style={styles.headerRight}>
            {showNotifications && (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push("/(protected)/notifications")}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("notifications.openInbox")}
              >
                <View style={styles.notificationIconWrap}>
                  <Ionicons
                    name="notifications-outline"
                    size={26}
                    color={Colors.text}
                  />
                  {unreadCount > 0 ? (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount >= 100 ? "99+" : String(unreadCount)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
            {hideHeaderProfile ? (
              <View style={styles.headerProfilePlaceholder} />
            ) : (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={handleProfilePress}
                activeOpacity={0.7}
              >
                <ProfileAvatar
                  uri={user?.profile_picture_url}
                  size={36}
                  name={user?.name ?? user?.email ?? undefined}
                  iconName="person"
                  iconColor={Colors.text}
                  placeholderBg={Colors.backgroundSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View
          style={styles.content}
          pointerEvents={sidebarVisible ? "none" : "auto"}
        >
          <Slot />
        </View>

        {/* Sidebar */}
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentRoute={pathname}
        />

        {/* Academic Year Picker Modal - Admin only */}
        {showYearPicker && (
        <Modal visible={yearPickerVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setYearPickerVisible(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>{t("academicYearPicker.title")}</Text>
              <ScrollView style={styles.modalList}>
                <TouchableOpacity
                  style={[styles.modalItem, !selectedAcademicYearId && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedAcademicYearId("");
                    setYearPickerVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, !selectedAcademicYearId && styles.modalItemTextActive]}>
                    {t("academicYearPicker.allYears")}
                  </Text>
                </TouchableOpacity>
                {academicYears.map((ay) => (
                  <TouchableOpacity
                    key={ay.id}
                    style={[styles.modalItem, selectedAcademicYearId === ay.id && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedAcademicYearId(ay.id);
                      setYearPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedAcademicYearId === ay.id && styles.modalItemTextActive,
                      ]}
                    >
                      {ay.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.modalItem, styles.createYearItem]}
                  onPress={() => {
                    setYearPickerVisible(false);
                    setCreateYearModalVisible(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.createYearText}>{t("academicYearPicker.createNew")}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
        )}

        <CreateAcademicYearModal
          visible={createYearModalVisible}
          onClose={() => setCreateYearModalVisible(false)}
          onSuccess={(created) => {
            queryClient.invalidateQueries({ queryKey: ["academics", "academicYears"] });
            setSelectedAcademicYearId(created.id);
          }}
        />
      </View>
    </SafeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: Layout.headerHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  notificationButton: {
    padding: Spacing.xs,
  },
  notificationIconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  profileButton: {
    padding: Spacing.xs,
  },
  /** Keeps header balance when profile avatar is hidden. */
  headerProfilePlaceholder: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  yearSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxWidth: 140,
  },
  yearSelectorText: {
    fontSize: 13,
    color: Colors.text,
    marginHorizontal: Spacing.xs,
  },
  yearSelectorPlaceholder: {
    flex: 1,
    maxWidth: 140,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 320,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  modalList: { maxHeight: 300 },
  modalItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  modalItemActive: { backgroundColor: Colors.primary + "20" },
  modalItemText: { fontSize: 16, color: Colors.text },
  modalItemTextActive: { color: Colors.primary, fontWeight: "600" },
  createYearItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.xs,
  },
  createYearText: { fontSize: 16, color: Colors.primary, fontWeight: "500" },
});
