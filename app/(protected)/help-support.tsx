import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";

const SUPPORT_EMAIL = "hello@nexchool.in";

export default function HelpSupportScreen() {
  const router = useRouter();

  const openEmail = () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Nexchool support")}`;
    void Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Need help with application? Send us an email and we will get back to you.
        </Text>

        <TouchableOpacity style={styles.emailCard} onPress={openEmail} activeOpacity={0.7}>
          <View style={styles.emailIconWrap}>
            <Ionicons name="mail-outline" size={28} color={Colors.primary} />
          </View>
          <View style={styles.emailTextWrap}>
            <Text style={styles.emailLabel}>Email us</Text>
            <Text style={styles.emailValue}>{SUPPORT_EMAIL}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          More support options will be available here in a future update.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  lead: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  emailIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  emailTextWrap: { flex: 1 },
  emailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  emailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  footerNote: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
});
