import React from "react";
import { useTranslation } from "react-i18next";
import { View, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useInvoice, useSendReminder } from "@/modules/fees/hooks/useFees";
import { feesService } from "@/modules/fees/services/feesService";
import { calendarLocaleForLanguage } from "@/i18n";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { formatCurrency } from "@/common/utils/formatCurrency";
import type { FeeInvoice } from "@/modules/fees/services/feesService";

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

/** Maps an invoice status to its accent palette token. */
const STATUS_ACCENT: Record<FeeInvoice["status"], keyof Palette> = {
  draft: "onSurfaceVariant",
  unpaid: "error",
  partial: "secondary",
  paid: "success",
  cancelled: "onSurfaceVariant",
};

export default function InvoiceDetailPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();

  const { data: invoice, isLoading, error } = useInvoice(id);
  const sendReminderMut = useSendReminder(id);

  // PRESERVED: blob-based PDF download flow.
  //   Service: `feesService.downloadInvoicePdf(id)` / `feesService.downloadReceiptPdf(paymentId)`
  //   Web: createObjectURL + anchor click. Native: Alert (informational; download not supported in-app).
  //   This is NOT `react-native-pdf`; just remote PDF fetch as Blob.
  const handleDownloadInvoice = async () => {
    try {
      const blob = await feesService.downloadInvoicePdf(id!);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice_${invoice?.invoice_number ?? id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(
          t("invoiceDetail.alerts.pdfInvoiceTitle"),
          t("invoiceDetail.alerts.pdfInvoiceBody")
        );
      }
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : t("invoiceDetail.alerts.downloadFailed")
      );
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const blob = await feesService.downloadReceiptPdf(paymentId);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt_${paymentId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(
          t("invoiceDetail.alerts.pdfReceiptTitle"),
          t("invoiceDetail.alerts.pdfReceiptBody")
        );
      }
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : t("invoiceDetail.alerts.downloadFailed")
      );
    }
  };

  const handleSendReminder = async () => {
    try {
      await sendReminderMut.mutateAsync(id!);
      Alert.alert(
        t("invoiceDetail.alerts.reminderSentTitle"),
        t("invoiceDetail.alerts.reminderSentBody")
      );
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : t("invoiceDetail.alerts.reminderFailed")
      );
    }
  };

  const handleShare = () => {
    Alert.alert(t("invoiceDetail.share", { defaultValue: "Share" }), "Coming soon");
  };

  if (isLoading && !invoice) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title="" />
        <View style={{ padding: spacing.marginMobile, gap: spacing.md }}>
          <Skeleton width="100%" height={180} radius={radius.xl} />
          <Skeleton width="100%" height={140} radius={radius.xl} />
          <Skeleton width="100%" height={140} radius={radius.xl} />
        </View>
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title="" />
        <EmptyState
          icon={<AppIcon name="document-text-outline" size="xl" color="onSurfaceVariant" />}
          title={t("invoiceDetail.notFound")}
          action={{ label: t("common.goBack"), onPress: () => router.back() }}
        />
      </View>
    );
  }

  const canSendReminder = invoice.status !== "paid" && invoice.status !== "cancelled";
  const accentToken: keyof Palette = STATUS_ACCENT[invoice.status] ?? "onSurfaceVariant";

  // Real fields: item.amount (pre-discount) vs item.net_amount (after discount/fine).
  const subtotal =
    invoice.items?.reduce((sum, it) => sum + (it.amount ?? it.net_amount ?? 0), 0) ??
    invoice.total_amount;
  const discount = Math.max(0, subtotal - (invoice.total_amount ?? 0));

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader title={invoice.invoice_number} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl * 3,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — invoice number + status, amount, dates. Status accent bar. */}
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: palette[accentToken],
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ flex: 1 }}>
              {invoice.invoice_number}
            </Text>
            <StatusBadge status={invoice.status} />
          </View>
          <Text variant="display" color="onSurface" style={{ marginTop: spacing.md }}>
            {formatCurrency(invoice.total_amount)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: spacing.md,
            }}
          >
            <View>
              <Text variant="labelSm" color="onSurfaceVariant">
                {t("invoiceDetail.issueDate", { defaultValue: "Issued" })}
              </Text>
              <Text variant="labelMd" color="onSurface" style={{ marginTop: 2 }}>
                {invoice.issue_date ? formatDate(invoice.issue_date, locale) : "—"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text variant="labelSm" color="onSurfaceVariant">
                {t("invoiceDetail.dueDate")}
              </Text>
              <Text variant="labelMd" color="onSurface" style={{ marginTop: 2 }}>
                {formatDate(invoice.due_date, locale)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line items */}
        {invoice.items && invoice.items.length > 0 ? (
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
            <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
              {t("invoiceDetail.feeBreakdown")}
            </Text>
            {invoice.items.map((it, idx) => (
              <View
                key={it.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: spacing.sm,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: palette.outlineVariant,
                }}
              >
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <Text variant="bodyMd" color="onSurface" numberOfLines={1}>
                    {it.fee_head}
                  </Text>
                  {it.period ? (
                    <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
                      {it.period}
                    </Text>
                  ) : null}
                </View>
                <Text variant="labelMd" color="onSurface">
                  {formatCurrency(it.net_amount)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Summary */}
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.sm,
            },
          ]}
        >
          <SummaryRow label={t("invoiceDetail.totalInvoice")} value={formatCurrency(subtotal)} />
          {discount > 0 ? (
            <SummaryRow
              label={t("invoiceDetail.discount", { defaultValue: "Discount" })}
              value={`- ${formatCurrency(discount)}`}
              valueColor="success"
            />
          ) : null}
          <SummaryRow
            label={t("invoiceDetail.amountPaid")}
            value={formatCurrency(invoice.amount_paid)}
            valueColor="success"
          />
          <View
            style={{
              height: 1,
              backgroundColor: palette.outlineVariant,
              marginVertical: spacing.xs,
            }}
          />
          <SummaryRow
            label={t("invoiceDetail.remainingBalance")}
            value={formatCurrency(invoice.remaining_balance)}
            bold
          />
        </View>

        {/* Payment history */}
        {invoice.payments && invoice.payments.length > 0 ? (
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
            <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
              {t("invoiceDetail.paymentHistory")}
            </Text>
            {invoice.payments.map((p, idx) => (
              <View
                key={p.id}
                style={{
                  flexDirection: "row",
                  paddingVertical: spacing.sm,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: palette.outlineVariant,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.full,
                    backgroundColor: palette.primaryContainer,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <AppIcon name="checkmark" size="sm" color="onPrimaryContainer" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="labelMd" color="onSurface">
                    {formatCurrency(p.amount)}
                  </Text>
                  <Text variant="labelSm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
                    {formatDate(p.payment_date || p.created_at, locale)} • {p.payment_method}
                    {p.payment_reference
                      ? ` • ${t("invoiceDetail.refPrefix")} ${p.payment_reference}`
                      : ""}
                  </Text>
                  <Pressable
                    onPress={() => handleDownloadReceipt(p.id)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: spacing.xs,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <AppIcon name="download-outline" size="sm" color="primary" />
                    <Text variant="labelSm" color="primary">
                      {t("invoiceDetail.receipt")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* PRESERVED: PDF actions (download + share) + reminder — no in-app payment CTA */}
        <View style={{ gap: spacing.md }}>
          <Pressable
            onPress={handleDownloadInvoice}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              backgroundColor: palette.primary,
              padding: spacing.md,
              borderRadius: radius.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppIcon name="download-outline" size="md" color="onPrimary" />
            <Text variant="labelMd" color="onPrimary">
              {t("invoiceDetail.downloadInvoice")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              backgroundColor: palette.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              padding: spacing.md,
              borderRadius: radius.md,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppIcon name="share-outline" size="md" color="onSurface" />
            <Text variant="labelMd" color="onSurface">
              {t("invoiceDetail.share", { defaultValue: "Share" })}
            </Text>
          </Pressable>

          {canSendReminder ? (
            <Pressable
              onPress={handleSendReminder}
              disabled={sendReminderMut.isPending}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
                backgroundColor: palette.surfaceContainerLowest,
                borderWidth: 1,
                borderColor: palette.outlineVariant,
                padding: spacing.md,
                borderRadius: radius.md,
                opacity: pressed || sendReminderMut.isPending ? 0.7 : 1,
              })}
            >
              <AppIcon name="notifications-outline" size="md" color="primary" />
              <Text variant="labelMd" color="primary">
                {t("invoiceDetail.sendReminder")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function BackHeader({ title }: { title: string }) {
  const { spacing } = useTheme();
  const router = useRouter();
  return (
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
      <AppIcon
        name="arrow-back"
        size="lg"
        color="onSurface"
        onPress={() => router.back()}
        accessibilityLabel="Back"
      />
      <Text variant="headlineLg" color="onSurface" numberOfLines={1} style={{ flex: 1 }}>
        {title}
      </Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor?: keyof Palette;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text variant="labelMd" color="onSurfaceVariant">
        {label}
      </Text>
      <Text
        variant={bold ? "headlineMd" : "labelMd"}
        color={valueColor ?? "onSurface"}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: FeeInvoice["status"] }) {
  const { t } = useTranslation("finance");
  const { palette, spacing, radius } = useTheme();
  const accentToken = STATUS_ACCENT[status] ?? "onSurfaceVariant";
  const color = palette[accentToken];
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
      <Text variant="labelSm" style={{ color }}>
        {t(`invoiceStatuses.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}
