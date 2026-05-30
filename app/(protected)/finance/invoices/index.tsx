import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInvoices } from "@/modules/fees/hooks/useFees";
import type { FeeInvoice } from "@/modules/fees/services/feesService";
import { calendarLocaleForLanguage } from "@/i18n";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { DashboardKpiCard } from "@/modules/home/components/DashboardKpiCard";
import { formatCurrency } from "@/common/utils/formatCurrency";
import { Protected } from "@/modules/permissions/components/Protected";
import * as PERMS from "@/modules/permissions/constants/permissions";

type IconName = keyof typeof Ionicons.glyphMap;

function formatDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function isOverdue(invoice: FeeInvoice): boolean {
  if (invoice.status === "paid" || invoice.status === "cancelled") return false;
  try {
    return new Date(invoice.due_date).getTime() < Date.now();
  } catch {
    return false;
  }
}

/** Maps a (resolved) invoice status to its accent palette token + badge glyph. */
const STATUS_META: Record<string, { accent: keyof Palette; icon: IconName }> = {
  overdue: { accent: "error", icon: "warning-outline" },
  unpaid: { accent: "secondary", icon: "time-outline" },
  partial: { accent: "secondary", icon: "time-outline" },
  draft: { accent: "onSurfaceVariant", icon: "document-outline" },
  paid: { accent: "tertiary", icon: "checkmark-circle-outline" },
  cancelled: { accent: "onSurfaceVariant", icon: "close-circle-outline" },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("finance");
  const { palette, spacing, radius } = useTheme();
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  const color = palette[meta.accent];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
        backgroundColor: `${color}1A`,
      }}
    >
      <AppIcon name={meta.icon} size="sm" color={meta.accent} />
      <Text variant="labelSm" style={{ color }}>
        {t(`invoiceStatuses.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}

export default function InvoicesListPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");

  // Server-side query: only `paid` maps cleanly; everything else fetched and filtered client-side.
  const serverStatus = filter === "paid" ? "paid" : undefined;
  const {
    data: invoices = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useInvoices({ status: serverStatus });

  const filteredInvoices = useMemo(() => {
    if (filter === "all") return invoices;
    if (filter === "paid") return invoices.filter((i) => i.status === "paid");
    if (filter === "overdue") return invoices.filter(isOverdue);
    if (filter === "pending")
      return invoices.filter(
        (i) => i.status === "unpaid" || i.status === "partial" || i.status === "draft"
      );
    return invoices;
  }, [invoices, filter]);

  // Summary derived only from real fields.
  const totalOutstanding = useMemo(
    () =>
      invoices
        .filter((i) => i.status !== "paid" && i.status !== "cancelled")
        .reduce((sum, i) => sum + (i.remaining_balance ?? 0), 0),
    [invoices]
  );

  // Earliest still-owed due date (real field, derivable). No fabricated values.
  const nextDueDate = useMemo(() => {
    const owed = invoices
      .filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.due_date)
      .map((i) => new Date(i.due_date).getTime())
      .filter((t) => !Number.isNaN(t));
    if (owed.length === 0) return null;
    return new Date(Math.min(...owed));
  }, [invoices]);

  const renderItem = ({ item }: { item: FeeInvoice }) => {
    const overdue = isOverdue(item);
    const resolvedStatus = overdue ? "overdue" : item.status;
    const meta = STATUS_META[resolvedStatus] ?? STATUS_META.draft;
    const isPaid = item.status === "paid";
    const dateLabel = isPaid
      ? t("invoices.paidOnLine", {
          defaultValue: "Paid on {{date}}",
          date: formatDate(item.updated_at ?? item.issue_date, locale),
        })
      : t("invoices.dueOnLine", {
          defaultValue: "Due {{date}}",
          date: formatDate(item.due_date, locale),
        });

    return (
      <PressScale
        onPress={() => router.push(`/(protected)/finance/invoices/${item.id}` as never)}
        style={[
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.md,
            marginBottom: spacing.md,
            borderLeftWidth: 4,
            borderLeftColor: palette[meta.accent],
            opacity: isPaid ? 0.85 : 1,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.xs,
          }}
        >
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ flex: 1 }}>
            {item.invoice_number}
          </Text>
          <StatusBadge status={resolvedStatus} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="labelMd" color="onSurface">
              {t("invoices.amountLabel", { defaultValue: "Total" })}
            </Text>
            <Text variant="headlineMd" color={isPaid ? "onSurfaceVariant" : "onSurface"}>
              {formatCurrency(item.total_amount)}
            </Text>
            <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
              {dateLabel}
            </Text>
            {!isPaid ? (
              <Text variant="labelSm" color="onSurface" style={{ marginTop: 2 }}>
                {t("invoices.balance", {
                  amount: formatCurrency(item.remaining_balance),
                })}
              </Text>
            ) : null}
          </View>
          <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
        </View>
      </PressScale>
    );
  };

  const filterOptions: { key: "all" | "paid" | "pending" | "overdue"; label: string }[] = [
    { key: "all", label: t("invoices.filterAll", { defaultValue: "All" }) },
    { key: "paid", label: t("invoices.filterPaid", { defaultValue: "Paid" }) },
    { key: "pending", label: t("invoices.filterPending", { defaultValue: "Pending" }) },
    { key: "overdue", label: t("invoices.filterOverdue", { defaultValue: "Overdue" }) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.lg,
          // Clear the FAB (56 + spacing.lg above the tab bar) without a big empty band.
          paddingBottom: spacing.lg + 56 + spacing.lg,
        }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={{ marginBottom: spacing.lg }}>
              <Text variant="display" color="onSurface">
                {t("invoices.title", { defaultValue: "Invoices" })}
              </Text>
              <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginTop: spacing.xs }}>
                {t("invoices.headerSubline", {
                  defaultValue: "{{n}} invoices · {{amount}} due",
                  n: invoices.length,
                  amount: formatCurrency(totalOutstanding),
                })}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <DashboardKpiCard
                  label={t("invoices.totalOutstanding", { defaultValue: "Total Outstanding" })}
                  value={formatCurrency(totalOutstanding)}
                  accentColor={totalOutstanding > 0 ? "error" : "success"}
                  iconName="wallet-outline"
                  iconChipBg={totalOutstanding > 0 ? "errorContainer" : "surfaceContainerHigh"}
                  iconChipFg={totalOutstanding > 0 ? "onErrorContainer" : "success"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DashboardKpiCard
                  label={t("invoices.nextDueDate", { defaultValue: "Next Due Date" })}
                  value={
                    nextDueDate
                      ? formatDate(nextDueDate.toISOString(), locale)
                      : t("invoices.noDue", { defaultValue: "—" })
                  }
                  accentColor="secondary"
                  iconName="calendar-outline"
                  iconChipBg="secondaryContainer"
                  iconChipFg="onSecondaryContainer"
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              {filterOptions.map((opt) => {
                const active = filter === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setFilter(opt.key)}
                    style={({ pressed }) => ({
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radius.full,
                      backgroundColor: active ? palette.primary : palette.surfaceContainerLow,
                      borderWidth: 1,
                      borderColor: active ? palette.primary : palette.outlineVariant,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text variant="labelSm" color={active ? "onPrimary" : "onSurface"}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          error ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
              <Text variant="bodyMd" color="error">
                {error instanceof Error ? error.message : t("common.failedToLoad")}
              </Text>
              <PressScale
                onPress={() => refetch()}
                style={{
                  marginTop: spacing.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: palette.primary,
                  borderRadius: radius.md,
                }}
              >
                <Text variant="labelMd" color="onPrimary">
                  {t("common.retry")}
                </Text>
              </PressScale>
            </View>
          ) : isLoading ? (
            <View style={{ gap: spacing.md }}>
              <Skeleton width="100%" height={108} radius={radius.xl} />
              <Skeleton width="100%" height={108} radius={radius.xl} />
              <Skeleton width="100%" height={108} radius={radius.xl} />
            </View>
          ) : (
            <EmptyState
              icon={<AppIcon name="document-text-outline" size="xl" color="onSurfaceVariant" />}
              title={t("invoices.emptyTitle", { defaultValue: "No invoices" })}
              description={t("invoices.emptySubtext", {
                defaultValue: "Invoices will appear here once issued.",
              })}
            />
          )
        }
      />

      <Protected permission={PERMS.FEES_INVOICE_CREATE}>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={t("invoices.createFab", { defaultValue: "Create invoice" })}
          onPress={() => router.push("/(protected)/finance/invoices/new" as never)}
          style={[
            elevation.card,
            {
              position: "absolute",
              bottom: spacing.lg,
              right: spacing.marginMobile,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: palette.primary,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <AppIcon name="add" size="lg" color="onPrimary" />
        </PressScale>
      </Protected>
    </View>
  );
}
