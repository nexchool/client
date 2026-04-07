import React from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { calendarLocaleForLanguage } from "@/i18n";
import { useFinanceDashboard } from "@/modules/finance/hooks/useFinance";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function FinanceDashboardPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const router = useRouter();
  const { data: dashboardData, isLoading, error, refetch, isRefetching } = useFinanceDashboard(10);

  const stats = {
    totalExpected: dashboardData?.total_expected ?? 0,
    totalCollected: dashboardData?.total_collected ?? 0,
    totalOutstanding: dashboardData?.total_outstanding ?? 0,
    overdueCount: dashboardData?.overdue_count ?? 0,
  };
  const recentPayments = dashboardData?.recent_payments ?? [];

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} style={{ marginBottom: Spacing.md }} />
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : t("common.failedToLoad")}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>{t("common.tryAgain")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t("dashboard.title")}</Text>
        <Text style={styles.subtitle}>{t("dashboard.subtitle")}</Text>
      </View>

      {isLoading && !dashboardData ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t("dashboard.loading")}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("dashboard.summary")}</Text>
            <Text style={styles.sectionHint}>{t("dashboard.summaryHint")}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.statValue} numberOfLines={1}>
                  {formatCurrency(stats.totalExpected)}
                </Text>
                <Text style={styles.statLabel}>{t("dashboard.totalExpected")}</Text>
              </View>
              <View style={[styles.statCard, styles.statCardSuccess]}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
                </View>
                <Text style={styles.statValue} numberOfLines={1}>
                  {formatCurrency(stats.totalCollected)}
                </Text>
                <Text style={styles.statLabel}>{t("dashboard.totalCollected")}</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardWarning]}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="hourglass-outline" size={24} color={Colors.warning} />
                </View>
                <Text style={styles.statValue} numberOfLines={1}>
                  {formatCurrency(stats.totalOutstanding)}
                </Text>
                <Text style={styles.statLabel}>{t("dashboard.totalOutstanding")}</Text>
              </View>
              <View style={[styles.statCard, stats.overdueCount > 0 && styles.statCardDanger]}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
                </View>
                <Text style={styles.statValue} numberOfLines={1}>
                  {stats.overdueCount}
                </Text>
                <Text style={styles.statLabel}>{t("dashboard.overdue")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("dashboard.quickActions")}</Text>
            <Text style={styles.sectionHint}>{t("dashboard.quickActionsHint")}</Text>
            <Pressable
              style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
              onPress={() => router.push("/(protected)/finance/structures" as any)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.cardIcon, styles.cardIconPrimary]}>
                  <Ionicons name="layers-outline" size={26} color={Colors.primary} />
                </View>
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>{t("dashboard.linkStructuresTitle")}</Text>
                  <Text style={styles.linkSubtitle}>{t("dashboard.linkStructuresSubtitle")}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
              onPress={() => router.push("/(protected)/finance/student-fees" as any)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.cardIcon, styles.cardIconPrimary]}>
                  <Ionicons name="people-outline" size={26} color={Colors.primary} />
                </View>
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>{t("dashboard.linkStudentFeesTitle")}</Text>
                  <Text style={styles.linkSubtitle}>{t("dashboard.linkStudentFeesSubtitle")}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
              onPress={() => router.push("/(protected)/finance/invoices" as any)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.cardIcon, styles.cardIconPrimary]}>
                  <Ionicons name="receipt-outline" size={26} color={Colors.primary} />
                </View>
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>{t("dashboard.linkInvoicesTitle")}</Text>
                  <Text style={styles.linkSubtitle}>{t("dashboard.linkInvoicesSubtitle")}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t("dashboard.recentPayments")}</Text>
                <Text style={styles.sectionHint}>{t("dashboard.recentPaymentsHint")}</Text>
              </View>
              {recentPayments.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push("/(protected)/finance/student-fees" as any)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.viewAllText}>{t("dashboard.viewAll")}</Text>
                </TouchableOpacity>
              )}
            </View>
            {recentPayments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="card-outline" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>{t("dashboard.noRecentPayments")}</Text>
                <Text style={styles.emptySubtitle}>
                  {t("dashboard.noRecentPaymentsHint")}
                </Text>
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => router.push("/(protected)/finance/student-fees" as any)}
                >
                  <Text style={styles.emptyCtaText}>{t("dashboard.goToStudentFees")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recentList}>
                {recentPayments.map((p, i) => (
                  <View
                    key={p.id}
                    style={[
                      styles.paymentRow,
                      i === recentPayments.length - 1 && styles.paymentRowLast,
                    ]}
                  >
                    <View style={styles.paymentAvatar}>
                      <Text style={styles.paymentAvatarText}>
                        {(p.student_name ?? "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentStudent}>
                        {p.student_name ?? t("common.unknown")}
                      </Text>
                      <Text style={styles.paymentDate}>
                        {new Date(p.created_at).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: { paddingBottom: Spacing.lg, marginBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xl },
  loadingText: { marginTop: Spacing.md, color: Colors.textSecondary, fontSize: 14 },
  errorText: { color: Colors.error, fontSize: 16, textAlign: "center" },
  retryBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
  },
  retryBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  content: {},
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: Colors.text },
  sectionHint: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  viewAllText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  statsGrid: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statCardSuccess: { borderLeftWidth: 3, borderLeftColor: Colors.success },
  statCardWarning: { borderLeftWidth: 3, borderLeftColor: Colors.warning },
  statCardDanger: { borderLeftWidth: 3, borderLeftColor: Colors.error },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 16, fontWeight: "700", color: Colors.text, marginTop: Spacing.sm },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.xs },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  linkCardPressed: { opacity: 0.85 },
  cardContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardIconPrimary: { backgroundColor: "rgba(0,0,0,0.06)" },
  linkText: { flex: 1 },
  linkTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, marginBottom: 2 },
  linkSubtitle: { fontSize: 13, color: Colors.textSecondary },
  emptyCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, marginTop: Spacing.md },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  emptyCta: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
  },
  emptyCtaText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  recentList: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.lg,
    overflow: "hidden",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paymentRowLast: { borderBottomWidth: 0 },
  paymentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  paymentAvatarText: { fontSize: 16, fontWeight: "600", color: Colors.textSecondary },
  paymentInfo: { flex: 1 },
  paymentStudent: { fontSize: 15, fontWeight: "500", color: Colors.text },
  paymentDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  paymentAmount: { fontSize: 16, fontWeight: "600", color: Colors.success },
});
