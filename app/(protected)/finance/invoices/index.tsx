import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInvoices } from "@/modules/fees/hooks/useFees";
import type { FeeInvoice } from "@/modules/fees/services/feesService";
import { calendarLocaleForLanguage } from "@/i18n";
import { useTheme } from "@/common/theme";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { formatCurrency } from "@/common/utils/formatCurrency";

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

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation("finance");
  const { palette, typography, spacing, radius } = useTheme();
  const colorMap: Record<string, string> = {
    draft: palette.onSurfaceVariant,
    unpaid: palette.error,
    partial: palette.warning,
    paid: palette.success,
    cancelled: palette.onSurfaceVariant,
    overdue: palette.error,
  };
  const color = colorMap[status] ?? palette.onSurfaceVariant;
  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: `${color}15`,
      }}
    >
      <Text style={[typography.labelSm, { color }]}>
        {t(`invoiceStatuses.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}

export default function InvoicesListPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const router = useRouter();
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">(
    "all"
  );

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
        (i) =>
          i.status === "unpaid" || i.status === "partial" || i.status === "draft"
      );
    return invoices;
  }, [invoices, filter]);

  // Header subline data
  const totalCount = invoices.length;
  const totalDue = useMemo(
    () =>
      invoices
        .filter((i) => i.status !== "paid" && i.status !== "cancelled")
        .reduce((sum, i) => sum + (i.remaining_balance ?? 0), 0),
    [invoices]
  );

  const renderItem = ({ item }: { item: FeeInvoice }) => {
    const overdue = isOverdue(item);
    return (
      <Pressable
        onPress={() =>
          router.push(`/(protected)/finance/invoices/${item.id}` as never)
        }
        style={({ pressed }) => [
          elevation.card,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.md,
            marginBottom: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            borderLeftWidth: overdue ? 4 : 0,
            borderLeftColor: palette.error,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: palette.primaryContainer,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="receipt-outline"
            size={22}
            color={palette.onPrimaryContainer}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={[typography.labelMd, { color: palette.onSurface }]}
              numberOfLines={1}
            >
              {item.invoice_number}
            </Text>
            <StatusPill status={overdue ? "overdue" : item.status} />
          </View>
          <Text
            style={[
              typography.labelSm,
              { color: palette.onSurfaceVariant, marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {t("invoices.dueLine", {
              date: formatDate(item.due_date, locale),
              amount: formatCurrency(item.total_amount),
            })}
          </Text>
          <Text
            style={[
              typography.labelSm,
              { color: palette.onSurface, marginTop: 2 },
            ]}
          >
            {t("invoices.balance", {
              amount: formatCurrency(item.remaining_balance),
            })}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={palette.onSurfaceVariant}
        />
      </Pressable>
    );
  };

  const filterOptions: {
    key: "all" | "paid" | "pending" | "overdue";
    label: string;
  }[] = [
    { key: "all", label: t("invoices.filterAll", { defaultValue: "All" }) },
    {
      key: "paid",
      label: t("invoices.filterPaid", { defaultValue: "Paid" }),
    },
    {
      key: "pending",
      label: t("invoices.filterPending", { defaultValue: "Pending" }),
    },
    {
      key: "overdue",
      label: t("invoices.filterOverdue", { defaultValue: "Overdue" }),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          gap: spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={{ padding: spacing.xs }}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={palette.onSurface}
          />
        </TouchableOpacity>
        <Text
          style={[typography.headlineLg, { color: palette.onSurface, flex: 1 }]}
        >
          {t("invoices.title", { defaultValue: "Invoices" })}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: spacing.marginMobile,
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={[typography.display, { color: palette.onSurface }]}
        >
          {t("invoices.title", { defaultValue: "Invoices" })}
        </Text>
        <Text
          style={[
            typography.bodyMd,
            { color: palette.onSurfaceVariant, marginTop: spacing.xs },
          ]}
        >
          {t("invoices.headerSubline", {
            defaultValue: "{{n}} invoices · {{amount}} due",
            n: totalCount,
            amount: formatCurrency(totalDue),
          })}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          paddingHorizontal: spacing.marginMobile,
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
                backgroundColor: active
                  ? palette.primary
                  : palette.surfaceContainerLow,
                borderWidth: 1,
                borderColor: active ? palette.primary : palette.outlineVariant,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={[
                  typography.labelSm,
                  { color: active ? palette.onPrimary : palette.onSurface },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View style={{ padding: spacing.lg, alignItems: "center" }}>
          <Text style={[typography.bodyMd, { color: palette.error }]}>
            {error instanceof Error ? error.message : t("common.failedToLoad")}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              backgroundColor: palette.primary,
              borderRadius: radius.md,
            }}
            onPress={() => refetch()}
          >
            <Text style={[typography.labelMd, { color: palette.onPrimary }]}>
              {t("common.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : isLoading && invoices.length === 0 ? (
        <View style={{ padding: spacing.marginMobile, gap: spacing.md }}>
          <Skeleton width="100%" height={88} radius={radius.xl} />
          <Skeleton width="100%" height={88} radius={radius.xl} />
          <Skeleton width="100%" height={88} radius={radius.xl} />
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingBottom: spacing.xl * 2,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={
                <Ionicons
                  name="document-text-outline"
                  size={36}
                  color={palette.onSurfaceVariant}
                />
              }
              title={t("invoices.emptyTitle", {
                defaultValue: "No invoices",
              })}
              description={t("invoices.emptySubtext", {
                defaultValue: "Invoices will appear here once issued.",
              })}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
