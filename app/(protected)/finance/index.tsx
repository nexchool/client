import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { calendarLocaleForLanguage } from "@/i18n";
import { useFinanceDashboard } from "@/modules/finance/hooks/useFinance";
import { useAdminDashboard } from "@/modules/dashboard/hooks/useAdminDashboard";
import { useTheme } from "@/common/theme";
import { useUiRole } from "@/modules/permissions/hooks/useUiRole";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { DashboardKpiCard } from "@/modules/home/components/DashboardKpiCard";
import { FeeTrendChart } from "@/modules/home/components/FeeTrendChart";
import { DashboardActionRow } from "@/modules/home/components/DashboardActionRow";
import { useStudentAcademicDashboard } from "@/modules/academics/hooks/useAcademicQueries";

function formatInr(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function FinanceIndex() {
  const { isStudent } = useUiRole();
  if (isStudent) return <StudentFinanceLanding />;
  return <AdminFinanceDashboard />;
}

function AdminFinanceDashboard() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const { palette, spacing, radius, elevation } = useTheme();

  // Summary + recent payments in one call (real shape: total_expected,
  // total_collected, total_outstanding, overdue_count, recent_payments[]).
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useFinanceDashboard(10);

  // Admin dashboard supplies the last-7-days collection series + month-over-month
  // trend that the finance summary endpoint does not. Reused honestly (labeled
  // "last 7 days"), gated on the fees feature being enabled.
  const { data: adminData } = useAdminDashboard();
  const finance = adminData?.finance;
  const collectionSeries = finance?.last_7_days_collection ?? [];
  const trendPct = finance?.trend_percentage ?? 0;
  const trendTone: "up" | "down" | "flat" =
    trendPct > 0 ? "up" : trendPct < 0 ? "down" : "flat";

  const totalCollected = dashboardData?.total_collected ?? 0;
  const totalOutstanding = dashboardData?.total_outstanding ?? 0;
  const overdueCount = dashboardData?.overdue_count ?? 0;
  const recentPayments = dashboardData?.recent_payments ?? [];

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <AppIcon name="alert-circle-outline" size="xl" color="error" />
        <Text variant="bodyMd" color="error" style={{ marginTop: spacing.md, textAlign: "center" }}>
          {error instanceof Error ? error.message : t("common.failedToLoad")}
        </Text>
        <PressScale
          onPress={() => refetch()}
          style={{
            marginTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: palette.primary,
            borderRadius: radius.md,
          }}
        >
          <Text variant="labelMd" color="onPrimary">
            {t("common.tryAgain")}
          </Text>
        </PressScale>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 3,
      }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" color="onSurface">
          {t("dashboard.title", { defaultValue: "Finance Dashboard" })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t("dashboard.subtitle", {
            defaultValue: "Overview of fee collection and pending dues.",
          })}
        </Text>
      </View>

      {isLoading && !dashboardData ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Skeleton width="48%" height={120} radius={radius.xl} />
          <Skeleton width="48%" height={120} radius={radius.xl} />
          <Skeleton width="48%" height={120} radius={radius.xl} />
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.totalCollected", { defaultValue: "Total Collected" })}
              value={formatInr(totalCollected)}
              accentColor="success"
              iconName="wallet-outline"
              iconChipBg="surfaceContainerHigh"
              iconChipFg="success"
              trend={
                trendPct !== 0
                  ? { label: `${trendPct > 0 ? "+" : ""}${trendPct}%`, tone: trendTone }
                  : undefined
              }
            />
          </View>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.totalOutstanding", { defaultValue: "Pending Fees" })}
              value={formatInr(totalOutstanding)}
              accentColor="secondary"
              iconName="hourglass-outline"
              iconChipBg="secondaryContainer"
              iconChipFg="onSecondaryContainer"
            />
          </View>
          <View style={{ width: "48%" }}>
            <DashboardKpiCard
              label={t("dashboard.overdue", { defaultValue: "Overdue Payments" })}
              value={String(overdueCount)}
              accentColor="error"
              iconName="alert-circle-outline"
              iconChipBg="errorContainer"
              iconChipFg="onErrorContainer"
              trend={
                overdueCount > 0
                  ? {
                      label: t("dashboard.overdueTrend", { defaultValue: "Needs attention" }),
                      tone: "down",
                    }
                  : undefined
              }
            />
          </View>
        </View>
      )}

      {collectionSeries.length > 0 ? (
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
            },
          ]}
        >
          <Text variant="headlineMd" color="onSurface">
            {t("dashboard.collectionChartTitle", { defaultValue: "Fee Collection" })}
          </Text>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
            {t("dashboard.collectionChartSubtitle", { defaultValue: "Last 7 days" })}
          </Text>
          <FeeTrendChart data={collectionSeries} />
        </View>
      ) : null}

      <View
        style={[
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.lg,
          },
        ]}
      >
        <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.sm }}>
          {t("dashboard.quickActions", { defaultValue: "Quick Actions" })}
        </Text>
        <DashboardActionRow
          title={t("dashboard.linkStructuresTitle", { defaultValue: "Fee Structures" })}
          subtitle={t("dashboard.linkStructuresSubtitle", {
            defaultValue: "Create and manage fee structures",
          })}
          iconName="layers-outline"
          iconChipBg="primaryContainer"
          iconChipFg="onPrimaryContainer"
          onPress={() => router.push("/(protected)/finance/structures" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.linkStudentFeesTitle", { defaultValue: "Student Fees" })}
          subtitle={t("dashboard.linkStudentFeesSubtitle", {
            defaultValue: "View fees and record payments",
          })}
          iconName="people-outline"
          iconChipBg="secondaryContainer"
          iconChipFg="onSecondaryContainer"
          onPress={() => router.push("/(protected)/finance/student-fees" as never)}
        />
        <DashboardActionRow
          title={t("dashboard.linkInvoicesTitle", { defaultValue: "Fee Invoices" })}
          subtitle={t("dashboard.linkInvoicesSubtitle", {
            defaultValue: "Manage invoices, payments & receipts",
          })}
          iconName="receipt-outline"
          iconChipBg="tertiaryContainer"
          iconChipFg="onTertiaryContainer"
          onPress={() => router.push("/(protected)/finance/invoices" as never)}
        />
      </View>

      <View
        style={[
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.lg,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.sm,
          }}
        >
          <Text variant="headlineMd" color="onSurface">
            {t("dashboard.recentPayments", { defaultValue: "Recent Transactions" })}
          </Text>
          {recentPayments.length > 0 ? (
            <PressScale
              onPress={() => router.push("/(protected)/finance/student-fees" as never)}
            >
              <Text variant="labelMd" color="primary">
                {t("dashboard.viewAll", { defaultValue: "View All" })}
              </Text>
            </PressScale>
          ) : null}
        </View>

        {recentPayments.length === 0 ? (
          <EmptyState
            icon={<AppIcon name="card-outline" size="xl" color="onSurfaceVariant" />}
            title={t("dashboard.noRecentPayments", { defaultValue: "No recent payments" })}
            description={t("dashboard.noRecentPaymentsHint", {
              defaultValue: "Payments you record will appear here",
            })}
          />
        ) : (
          <View>
            {recentPayments.map((payment, idx) => (
              <View
                key={payment.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingVertical: spacing.sm,
                  borderBottomWidth: idx === recentPayments.length - 1 ? 0 : 1,
                  borderBottomColor: palette.surfaceContainerHigh,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.full,
                    backgroundColor: palette.surfaceContainerHigh,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="labelMd" color="primary">
                    {(payment.student_name ?? "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelMd" color="onSurface" numberOfLines={1}>
                    {payment.student_name ?? t("common.unknown")}
                  </Text>
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {new Date(payment.created_at).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
                <Text variant="labelMd" color="success">
                  {formatInr(payment.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StudentFinanceLanding() {
  const { t } = useTranslation("finance");
  const { spacing, radius } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useStudentAcademicDashboard();

  // Real shape: `fees_summary` (NOT `fees`). Only these three fields exist.
  const fees = data?.fees_summary ?? null;
  const totalOutstanding = fees?.total_outstanding ?? 0;
  const daysUntilDue = fees?.days_until_due ?? null;
  const overdueCount = fees?.overdue_count ?? 0;

  const heroAccent: "error" | "success" = totalOutstanding > 0 ? "error" : "success";

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.marginMobile,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 3,
      }}
      refreshControl={<RefreshControl refreshing={!!isRefetching} onRefresh={() => refetch()} />}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" color="onSurface">
          {t("student.title", { defaultValue: "Finance" })}
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
          {t("student.subtitle", { defaultValue: "Your fees and invoices" })}
        </Text>
      </View>

      {isLoading && !data ? (
        <Skeleton width="100%" height={120} radius={radius.xl} />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <View style={{ width: "100%" }}>
            <DashboardKpiCard
              label={
                totalOutstanding > 0
                  ? t("student.pendingFees", { defaultValue: "Pending Fees" })
                  : t("student.allPaid", { defaultValue: "Fees Clear" })
              }
              value={
                totalOutstanding > 0
                  ? formatInr(totalOutstanding)
                  : t("student.noFeesDue", { defaultValue: "All paid" })
              }
              accentColor={heroAccent}
              iconName="wallet-outline"
              iconChipBg={totalOutstanding > 0 ? "errorContainer" : "primaryContainer"}
              iconChipFg={totalOutstanding > 0 ? "onErrorContainer" : "onPrimaryContainer"}
              trend={
                totalOutstanding > 0 && daysUntilDue != null
                  ? {
                      label:
                        daysUntilDue < 0
                          ? t("student.overdueByDays", {
                              defaultValue: "Overdue by {{n}} days",
                              n: Math.abs(daysUntilDue),
                            })
                          : t("student.dueInDays", {
                              defaultValue: "Due in {{n}} days",
                              n: daysUntilDue,
                            }),
                      tone: daysUntilDue < 0 ? "down" : "flat",
                    }
                  : undefined
              }
            />
          </View>
          {overdueCount > 0 ? (
            <View style={{ width: "100%" }}>
              <DashboardKpiCard
                label={t("student.overdueInvoices", { defaultValue: "Overdue Invoices" })}
                value={String(overdueCount)}
                accentColor="error"
                iconName="alert-circle-outline"
                iconChipBg="errorContainer"
                iconChipFg="onErrorContainer"
              />
            </View>
          ) : null}
        </View>
      )}

      <DashboardActionRow
        title={t("student.viewInvoices", { defaultValue: "My Invoices" })}
        subtitle={t("student.viewInvoicesSub", {
          defaultValue: "See all fee invoices and dues",
        })}
        iconName="receipt-outline"
        iconChipBg="primaryContainer"
        iconChipFg="onPrimaryContainer"
        onPress={() => router.push("/(protected)/finance/invoices" as never)}
      />
    </ScrollView>
  );
}
