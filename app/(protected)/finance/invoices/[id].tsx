import React from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInvoice, useSendReminder } from "@/modules/fees/hooks/useFees";
import { feesService } from "@/modules/fees/services/feesService";
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

export default function InvoiceDetailPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette, spacing, radius, typography, elevation } = useTheme();

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
        e instanceof Error
          ? e.message
          : t("invoiceDetail.alerts.reminderFailed")
      );
    }
  };

  const handleShare = () => {
    Alert.alert(
      t("invoiceDetail.share", { defaultValue: "Share" }),
      "Coming soon"
    );
  };

  if (isLoading && !invoice) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={""} />
        <View style={{ padding: spacing.marginMobile, gap: spacing.md }}>
          <Skeleton width="100%" height={180} radius={radius.xl} />
          <Skeleton width="100%" height={140} radius={radius.xl} />
          <Skeleton width="100%" height={140} radius={radius.xl} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={""} />
        <EmptyState
          icon={
            <Ionicons
              name="document-text-outline"
              size={36}
              color={palette.onSurfaceVariant}
            />
          }
          title={t("invoiceDetail.notFound")}
          action={{
            label: t("common.goBack"),
            onPress: () => router.back(),
          }}
        />
      </SafeAreaView>
    );
  }

  const canSendReminder =
    invoice.status !== "paid" && invoice.status !== "cancelled";

  const heroAccent =
    invoice.status === "paid"
      ? palette.success
      : invoice.status === "unpaid"
        ? palette.error
        : invoice.status === "partial"
          ? palette.warning
          : palette.primary;

  const subtotal =
    invoice.items?.reduce(
      (sum, it: any) => sum + (it.amount ?? it.net_amount ?? 0),
      0
    ) ?? invoice.total_amount;
  const discount = Math.max(0, subtotal - (invoice.total_amount ?? 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader title={invoice.invoice_number} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.xl * 3,
          gap: spacing.lg,
        }}
      >
        {/* Hero */}
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: heroAccent,
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
            <Text
              style={[typography.labelSm, { color: palette.onSurfaceVariant }]}
            >
              {invoice.invoice_number}
            </Text>
            <StatusPill status={invoice.status} />
          </View>
          <Text
            style={[
              typography.display,
              { color: palette.onSurface, marginTop: spacing.md },
            ]}
          >
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
              <Text
                style={[
                  typography.labelSm,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                {t("invoiceDetail.issueDate", { defaultValue: "Issued" })}
              </Text>
              <Text
                style={[
                  typography.labelMd,
                  { color: palette.onSurface, marginTop: 2 },
                ]}
              >
                {invoice.created_at
                  ? formatDate(invoice.created_at, locale)
                  : "—"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={[
                  typography.labelSm,
                  { color: palette.onSurfaceVariant },
                ]}
              >
                {t("invoiceDetail.dueDate")}
              </Text>
              <Text
                style={[
                  typography.labelMd,
                  { color: palette.onSurface, marginTop: 2 },
                ]}
              >
                {formatDate(invoice.due_date, locale)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line items */}
        {invoice.items && invoice.items.length > 0 && (
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
            <Text
              style={[
                typography.headlineMd,
                { color: palette.onSurface, marginBottom: spacing.md },
              ]}
            >
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
                <Text
                  style={[typography.bodyMd, { color: palette.onSurface, flex: 1 }]}
                  numberOfLines={1}
                >
                  {it.fee_head}
                </Text>
                <Text
                  style={[typography.labelMd, { color: palette.onSurface }]}
                >
                  {formatCurrency(it.net_amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

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
          <SummaryRow
            label={t("invoiceDetail.totalInvoice")}
            value={formatCurrency(subtotal)}
          />
          {discount > 0 && (
            <SummaryRow
              label={t("invoiceDetail.discount", { defaultValue: "Discount" })}
              value={`- ${formatCurrency(discount)}`}
              valueColor={palette.success}
            />
          )}
          <SummaryRow
            label={t("invoiceDetail.amountPaid")}
            value={formatCurrency(invoice.amount_paid)}
            valueColor={palette.success}
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

        {/* Payment history (timeline) */}
        {invoice.payments && invoice.payments.length > 0 && (
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
            <Text
              style={[
                typography.headlineMd,
                { color: palette.onSurface, marginBottom: spacing.md },
              ]}
            >
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
                    borderRadius: 16,
                    backgroundColor: palette.primaryContainer,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={palette.onPrimaryContainer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      typography.labelMd,
                      { color: palette.onSurface },
                    ]}
                  >
                    {formatCurrency(p.amount)}
                  </Text>
                  <Text
                    style={[
                      typography.labelSm,
                      { color: palette.onSurfaceVariant, marginTop: 2 },
                    ]}
                  >
                    {formatDate(p.payment_date || p.created_at, locale)} •{" "}
                    {p.payment_method}
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
                    <Ionicons
                      name="download-outline"
                      size={14}
                      color={palette.primary}
                    />
                    <Text
                      style={[typography.labelSm, { color: palette.primary }]}
                    >
                      {t("invoiceDetail.receipt")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PRESERVED: PDF actions (download + share) — no in-app payment CTA */}
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
            <Ionicons
              name="download-outline"
              size={20}
              color={palette.onPrimary}
            />
            <Text style={[typography.labelMd, { color: palette.onPrimary }]}>
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
            <Ionicons
              name="share-outline"
              size={20}
              color={palette.onSurface}
            />
            <Text style={[typography.labelMd, { color: palette.onSurface }]}>
              {t("invoiceDetail.share", { defaultValue: "Share" })}
            </Text>
          </Pressable>

          {canSendReminder && (
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
              <Ionicons
                name="notifications-outline"
                size={20}
                color={palette.primary}
              />
              <Text style={[typography.labelMd, { color: palette.primary }]}>
                {t("invoiceDetail.sendReminder")}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BackHeader({ title }: { title: string }) {
  const { palette, spacing, typography } = useTheme();
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
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={12}
        style={{ padding: spacing.xs }}
      >
        <Ionicons name="chevron-back" size={26} color={palette.onSurface} />
      </TouchableOpacity>
      <Text
        style={[typography.headlineLg, { color: palette.onSurface, flex: 1 }]}
        numberOfLines={1}
      >
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
  valueColor?: string;
  bold?: boolean;
}) {
  const { palette, typography } = useTheme();
  const valueStyle = bold ? typography.headlineMd : typography.labelMd;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={[typography.labelMd, { color: palette.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text
        style={[valueStyle, { color: valueColor ?? palette.onSurface }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
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
