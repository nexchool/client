import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { setAppLanguage, getAppLanguage, type SupportedLanguage } from "@/i18n";

/** Compact control width (fits EN/GU labels without spanning the row) */
const DROPDOWN_WIDTH = 148;

const LANGUAGE_OPTIONS: {
  code: SupportedLanguage;
  labelKey: "language.english" | "language.gujarati";
}[] = [
  { code: "en", labelKey: "language.english" },
  { code: "gu", labelKey: "language.gujarati" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation(["navigation", "settings", "common"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const current = getAppLanguage();

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t("common:back")}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("navigation:tabs.settings")}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.settingsCard}>
          <View style={styles.languageRow}>
            <Text style={styles.languageLabel} numberOfLines={1}>
              {t("settings:languageSectionTitle")}
            </Text>
            <TouchableOpacity
              style={[styles.dropdown, pending && styles.dropdownDisabled]}
              onPress={() => !pending && setDropdownOpen(true)}
              disabled={pending}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t("settings:languageSwitcherHint")}
              accessibilityHint={t("settings:languageDropdownHint")}
            >
              {pending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.dropdownValue} numberOfLines={1}>
                  {currentLabel}
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t("settings:languageSectionTitle")}</Text>
            <View style={styles.modalDivider} />
            {LANGUAGE_OPTIONS.map(({ code, labelKey }, index) => {
              const selected = current === code;
              const isLast = index === LANGUAGE_OPTIONS.length - 1;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.modalOption, !isLast && styles.modalOptionBorder]}
                  onPress={() => void selectLanguage(code)}
                  activeOpacity={0.65}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}
                  >
                    {t(`settings:${labelKey}`)}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  ) : (
                    <View style={styles.modalOptionSpacer} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Same shell as finance detail lists (e.g. student-fees/index) */
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    fontFamily: "System",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  /** Same pattern as profile `infoCard` / help-support `emailCard` */
  settingsCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  /** profile `cardTitle` */
  languageLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "System",
  },
  /** Compact control; fill/edge colours aligned with MainLayout year selector */
  dropdown: {
    width: DROPDOWN_WIDTH,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 44,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  dropdownDisabled: {
    opacity: 0.7,
  },
  /** profile `cardTitle` */
  dropdownValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "System",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    overflow: "hidden",
    paddingBottom: Spacing.xs,
  },
  /** help-support `emailLabel` */
  modalTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "System",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  modalOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    fontFamily: "System",
    flex: 1,
  },
  modalOptionTextSelected: {
    fontWeight: "600",
    color: Colors.primary,
  },
  modalOptionSpacer: {
    width: 20,
    height: 20,
  },
});
