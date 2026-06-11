import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useStudentFee,
  useRecordPayment,
  useRefundPayment,
  useDeleteStudentFee,
} from "@/modules/finance/hooks/useFinance";
import { financeService } from "@/modules/finance/services/financeService";
import type { RecordPaymentInput } from "@/modules/finance/types";
import { calendarLocaleForLanguage } from "@/i18n";
import { useTheme, type Palette } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { Skeleton } from "@/common/components/Skeleton";
import { EmptyState } from "@/common/components/EmptyState";
import { formatCurrency } from "@/common/utils/formatCurrency";

function formatDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale);
  } catch {
    return s;
  }
}

function daysUntil(dateStr: string): number | null {
  try {
    const due = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

type AllocationState = Record<string, string>;

export default function StudentFeeDetailPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const router = useRouter();
  const { palette, spacing, radius, elevation } = useTheme();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const consumedActionRef = React.useRef(false);
  // A fresh dedup token per opened payment attempt; if it reaches the server
  // twice (a retry / lost-response), the server returns the original payment
  // instead of charging again.
  const idempotencyKeyRef = React.useRef<string>("");

  useEffect(() => {
    if (action === "record" && !consumedActionRef.current) {
      consumedActionRef.current = true;
      setPaymentModalOpen(true);
    }
  }, [action]);

  useEffect(() => {
    if (paymentModalOpen) {
      idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }, [paymentModalOpen]);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [otherMethodDetail, setOtherMethodDetail] = useState("");
  const [notes, setNotes] = useState("");
  const [allocations, setAllocations] = useState<AllocationState>({});
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useStudentFee(id);
  const recordMut = useRecordPayment();
  const refundMut = useRefundPayment(id);
  const deleteFeeMut = useDeleteStudentFee();

  const remaining = (data?.total_amount ?? 0) - (data?.paid_amount ?? 0);
  const itemsWithRemaining = (data?.items ?? []).filter(
    (item) => (item.amount ?? 0) - (item.paid_amount ?? 0) > 0
  );

  const amountNum = parseFloat(amount) || 0;
  const amountExceedsRemaining =
    amountNum > remaining && amount.trim() !== "";
  const allocationSum = itemsWithRemaining.reduce(
    (sum, item) => sum + (parseFloat(allocations[item.id] ?? "0") || 0),
    0
  );
  const useAllocations = allocationSum > 0;
  const allocationMismatch =
    useAllocations && Math.abs(allocationSum - amountNum) > 0.01;
  const refRequired = method !== "cash";
  const refOk = !refRequired || referenceNumber.trim().length > 0;
  const otherOk = method !== "other" || otherMethodDetail.trim().length > 0;
  const canSubmitPayment =
    !recordMut.isPending &&
    amountNum > 0 &&
    amountNum <= remaining &&
    (!useAllocations || !allocationMismatch) &&
    refOk &&
    otherOk;

  const handleQuickAmount = (ratio: number) => {
    const amt = Math.round(remaining * ratio);
    setAmount(String(amt));
  };

  const handlePayFullForItem = (item: {
    id: string;
    amount?: number;
    paid_amount?: number;
  }) => {
    const itemRemaining = (item.amount ?? 0) - (item.paid_amount ?? 0);
    if (itemRemaining > 0) {
      setAllocations((prev) => {
        const next = { ...prev, [item.id]: String(itemRemaining) };
        const sum = Object.values(next).reduce(
          (s, v) => s + (parseFloat(v) || 0),
          0
        );
        setAmount(String(sum));
        return next;
      });
    }
  };

  const handleAutoAllocate = () => {
    if (!amountNum || amountNum <= 0 || amountNum > remaining) return;
    const newAllocations: AllocationState = {};
    let left = amountNum;
    for (const item of itemsWithRemaining) {
      if (left <= 0) break;
      const itemRemaining = (item.amount ?? 0) - (item.paid_amount ?? 0);
      if (itemRemaining <= 0) continue;
      const toApply = Math.min(left, itemRemaining);
      newAllocations[item.id] = String(toApply);
      left -= toApply;
    }
    setAllocations(newAllocations);
  };

  const clearAllocations = () => setAllocations({});

  const handleRecordPayment = async () => {
    const amt = parseFloat(amount);
    if (!id || isNaN(amt) || amt <= 0) {
      Alert.alert(t("common.error"), t("studentFeeDetail.alerts.validAmount"));
      return;
    }
    if (amt > remaining) return;
    if (useAllocations && allocationMismatch) {
      Alert.alert(
        t("common.error"),
        t("studentFeeDetail.alerts.allocationSum")
      );
      return;
    }
    try {
      const payload: RecordPaymentInput = {
        student_fee_id: id,
        amount: amt,
        method,
        reference_number: referenceNumber.trim() || undefined,
        method_detail:
          method === "other" ? otherMethodDetail.trim() : undefined,
        notes: notes || undefined,
        idempotency_key: idempotencyKeyRef.current || undefined,
      };
      if (useAllocations) {
        payload.allocations = itemsWithRemaining
          .filter((item) => parseFloat(allocations[item.id] ?? "0") > 0)
          .map((item) => ({
            item_id: item.id,
            amount: parseFloat(allocations[item.id] ?? "0") || 0,
          }));
      }
      await recordMut.mutateAsync(payload);
      setPaymentModalOpen(false);
      setAmount("");
      setReferenceNumber("");
      setOtherMethodDetail("");
      setNotes("");
      setAllocations({});
    } catch (e: any) {
      Alert.alert(
        t("common.error"),
        e?.message ?? t("studentFeeDetail.alerts.recordFailed")
      );
    }
  };

  const openRefundModal = (paymentId: string) => {
    setRefundPaymentId(paymentId);
    setRefundReason("");
    setRefundModalOpen(true);
  };

  const handleRefund = async () => {
    if (!refundPaymentId) return;
    try {
      await refundMut.mutateAsync({
        paymentId: refundPaymentId,
        notes: refundReason.trim() || undefined,
      });
      setRefundModalOpen(false);
      setRefundPaymentId(null);
      setRefundReason("");
    } catch (e: any) {
      Alert.alert(
        t("common.error"),
        e?.message ?? t("studentFeeDetail.alerts.refundFailed")
      );
    }
  };

  const handleDownloadInvoice = async () => {
    if (!id) return;
    setDownloading("invoice");
    const filename = `invoice_${data?.fee_structure_name?.replace(/\s+/g, "_") ?? id}`;
    try {
      if (Platform.OS === "web") {
        const blob = await financeService.downloadInvoicePdf(id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await financeService.shareInvoicePdf(
          id,
          filename,
          t("studentFeeDetail.alerts.pdfInvoiceTitle")
        );
      }
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e instanceof Error
          ? e.message
          : t("studentFeeDetail.alerts.downloadInvoiceFailed")
      );
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    setDownloading(paymentId);
    const filename = `receipt_${paymentId.slice(0, 8)}`;
    try {
      if (Platform.OS === "web") {
        const blob = await financeService.downloadReceiptPdf(paymentId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await financeService.shareReceiptPdf(
          paymentId,
          filename,
          t("studentFeeDetail.alerts.pdfReceiptTitle")
        );
      }
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e instanceof Error
          ? e.message
          : t("studentFeeDetail.alerts.downloadReceiptFailed")
      );
    } finally {
      setDownloading(null);
    }
  };

  const handleRemoveFromStructure = async () => {
    if (!id) return;
    Alert.alert(
      t("studentFeeDetail.alerts.removeTitle"),
      t("studentFeeDetail.alerts.removeMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFeeMut.mutateAsync(id);
              Alert.alert(
                t("studentFeeDetail.alerts.removeSuccessTitle"),
                t("studentFeeDetail.alerts.removeSuccessMessage"),
                [
                  {
                    text: t("common.ok"),
                    onPress: () =>
                      router.replace(
                        "/(protected)/finance/student-fees" as any
                      ),
                  },
                ],
                { cancelable: false }
              );
            } catch (e: any) {
              Alert.alert(
                t("common.error"),
                e?.message ?? t("studentFeeDetail.alerts.removeFailed")
              );
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("studentFeeDetail.title")} />
        <EmptyState
          icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
          title={
            error instanceof Error ? error.message : t("common.failedToLoad")
          }
        />
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("studentFeeDetail.title")} />
        <View
          style={{
            padding: spacing.marginMobile,
            gap: spacing.md,
          }}
        >
          <Skeleton width="100%" height={180} radius={radius.xl} />
          <Skeleton width="100%" height={120} radius={radius.xl} />
          <Skeleton width="100%" height={120} radius={radius.xl} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface }}>
        <BackHeader title={t("studentFeeDetail.title")} />
        <EmptyState
          icon={
            <AppIcon
              name="document-text-outline"
              size="xl"
              color="onSurfaceVariant"
            />
          }
          title={t("common.notFound")}
        />
      </View>
    );
  }

  const heroAccent: keyof Palette =
    data.status === "paid"
      ? "success"
      : data.status === "overdue"
        ? "error"
        : "primary";
  const dueDays = daysUntil(data.due_date);

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader title={t("studentFeeDetail.title")} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.xl * 3,
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Hero card */}
        <View
          style={[
            elevation.card,
            {
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: palette[heroAccent],
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
                {data.fee_structure_name ?? "—"}
              </Text>
              <Text
                variant="headlineLg"
                color="onSurface"
                numberOfLines={1}
                style={{ marginTop: 2 }}
              >
                {data.student_name ?? "—"}
              </Text>
            </View>
            <StatusPill status={data.status} />
          </View>

          <Text
            variant="display"
            color="onSurface"
            style={{ marginTop: spacing.md }}
          >
            {formatCurrency(data.total_amount)}
          </Text>
          <Text variant="labelMd" color="onSurfaceVariant" style={{ marginTop: 2 }}>
            {t("studentFeeDetail.total", { defaultValue: "Total" })}
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              marginTop: spacing.md,
            }}
          >
            <Pressable
              onPress={handleDownloadInvoice}
              disabled={!!downloading}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.primary,
                backgroundColor: palette.surfaceContainerLowest,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {downloading === "invoice" ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : (
                <AppIcon
                  name="document-text-outline"
                  size="sm"
                  color="primary"
                />
              )}
              <Text variant="labelMd" color="primary">
                {t("studentFeeDetail.downloadInvoice")}
              </Text>
            </Pressable>
            {remaining > 0 && (
              <Pressable
                onPress={() => setPaymentModalOpen(true)}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.xs,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: palette.primary,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <AppIcon name="card-outline" size="sm" color="onPrimary" />
                <Text variant="labelMd" color="onPrimary">
                  {t("studentFeeDetail.recordPayment")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Detail rows card */}
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
          <DetailRow
            label={t("studentFeeDetail.paid", { defaultValue: "Paid" })}
            value={formatCurrency(data.paid_amount)}
            valueColor="success"
          />
          <DetailRow
            label={t("studentFeeDetail.remaining", {
              defaultValue: "Remaining",
            })}
            value={formatCurrency(remaining)}
            valueColor={remaining > 0 ? "warning" : "onSurface"}
          />
          <DetailRow
            label={t("studentFeeDetail.dueDate", { defaultValue: "Due date" })}
            value={`${formatDate(data.due_date, locale)}${
              dueDays != null && remaining > 0
                ? dueDays >= 0
                  ? ` · ${t("studentFeeDetail.dueInDays", {
                      defaultValue: "{{n}} days",
                      n: dueDays,
                    })}`
                  : ` · ${t("studentFeeDetail.overdueByDays", {
                      defaultValue: "Overdue by {{n}} days",
                      n: Math.abs(dueDays),
                    })}`
                : ""
            }`}
          />
          <Pressable
            onPress={handleRemoveFromStructure}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: spacing.xs,
              paddingVertical: spacing.xs,
              marginTop: spacing.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppIcon name="trash-outline" size="sm" color="error" />
            <Text variant="labelSm" color="error">
              {t("studentFeeDetail.removeFromStructure")}
            </Text>
          </Pressable>
        </View>

        {/* Fee items */}
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
            variant="headlineMd"
            color="onSurface"
            style={{ marginBottom: spacing.md }}
          >
            {t("studentFeeDetail.feeItems")}
          </Text>
          {(data.items ?? []).length === 0 ? (
            <Text variant="bodyMd" color="onSurfaceVariant">
              {t("studentFeeDetail.noFeeItems")}
            </Text>
          ) : (
            (data.items ?? []).map((item, idx) => {
              const itemAmount = item.amount ?? 0;
              const itemPaid = item.paid_amount ?? 0;
              const itemRemaining = itemAmount - itemPaid;
              const itemStatus: "paid" | "partial" | "unpaid" =
                itemPaid >= itemAmount
                  ? "paid"
                  : itemPaid > 0
                    ? "partial"
                    : "unpaid";
              return (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: spacing.sm,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: palette.outlineVariant,
                  }}
                >
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text variant="labelMd" color="onSurface">
                      {item.component_name ?? "—"}
                    </Text>
                    <Text
                      variant="labelSm"
                      color="onSurfaceVariant"
                      style={{ marginTop: 2 }}
                    >
                      {t("studentFeeDetail.itemMeta", {
                        total: formatCurrency(item.amount),
                        paid: formatCurrency(item.paid_amount),
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text variant="labelSm" color="warning">
                      {t("studentFeeDetail.itemLeft", {
                        amount: formatCurrency(itemRemaining),
                      })}
                    </Text>
                    <StatusPill status={itemStatus} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Payment history */}
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
            variant="headlineMd"
            color="onSurface"
            style={{ marginBottom: spacing.md }}
          >
            {t("studentFeeDetail.paymentHistory")}
          </Text>
          {(data.payments ?? []).length === 0 ? (
            <Text variant="bodyMd" color="onSurfaceVariant">
              {t("studentFeeDetail.noPaymentsYet")}
            </Text>
          ) : (
            (data.payments ?? []).map((p, idx) => {
              const methodLabel = t(
                `studentFeeDetail.paymentMethods.${p.method}`,
                { defaultValue: p.method }
              );
              const methodLine =
                p.method === "other" && p.method_detail
                  ? `${methodLabel} (${p.method_detail})`
                  : methodLabel;
              return (
                <View
                  key={p.id}
                  style={{
                    paddingVertical: spacing.sm,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: palette.outlineVariant,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text variant="labelMd" color="onSurface">
                      {formatCurrency(p.amount)}
                    </Text>
                    <StatusPill status={p.status} kind="payment" />
                  </View>
                  <Text
                    variant="labelSm"
                    color="onSurfaceVariant"
                    style={{ marginTop: 2 }}
                  >
                    {methodLine} • {formatDate(p.created_at, locale)}
                    {p.reference_number ? ` • ${p.reference_number}` : ""}
                  </Text>
                  {p.status === "success" && (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: spacing.md,
                        marginTop: spacing.xs,
                      }}
                    >
                      <Pressable
                        onPress={() => handleDownloadReceipt(p.id)}
                        disabled={!!downloading}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        {downloading === p.id ? (
                          <ActivityIndicator
                            size="small"
                            color={palette.primary}
                          />
                        ) : (
                          <AppIcon
                            name="receipt-outline"
                            size="sm"
                            color="primary"
                          />
                        )}
                        <Text variant="labelSm" color="primary">
                          {t("studentFeeDetail.receipt")}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openRefundModal(p.id)}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <AppIcon
                          name="arrow-undo-outline"
                          size="sm"
                          color="error"
                        />
                        <Text variant="labelSm" color="error">
                          {t("studentFeeDetail.refund")}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Statement CTA */}
        <Pressable
          onPress={() =>
            Alert.alert(
              t("studentFeeDetail.viewStatement", {
                defaultValue: "View statement",
              }),
              "Coming soon"
            )
          }
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs,
            paddingVertical: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: palette.outlineVariant,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <AppIcon name="bar-chart-outline" size="sm" color="onSurface" />
          <Text variant="labelMd" color="onSurface">
            {t("studentFeeDetail.viewStatement", {
              defaultValue: "View statement",
            })}
          </Text>
        </Pressable>
      </ScrollView>

      {/* PRESERVED: Record Payment Modal verbatim */}
      <Modal visible={paymentModalOpen} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View
            style={[
              modalStyles.content,
              { backgroundColor: palette.surface },
            ]}
          >
            <View
              style={[
                modalStyles.header,
                { borderBottomColor: palette.outlineVariant },
              ]}
            >
              <Text variant="headlineMd" color="onSurface">
                {t("studentFeeDetail.paymentModal.title")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setPaymentModalOpen(false);
                  setAllocations({});
                  setOtherMethodDetail("");
                }}
              >
                <AppIcon name="close" size="lg" color="onSurface" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: spacing.lg, maxHeight: 420 }}>
              <View
                style={{
                  backgroundColor: palette.surfaceContainer,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                }}
              >
                <Text variant="labelSm" color="onSurfaceVariant">
                  {t("studentFeeDetail.paymentModal.remainingBalance")}
                </Text>
                <Text variant="headlineLg" color="warning" style={{ marginTop: 2 }}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
              <Text
                variant="labelMd"
                color="onSurface"
                style={{ marginBottom: spacing.sm }}
              >
                {t("studentFeeDetail.paymentModal.amount")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                }}
              >
                {[
                  { ratio: 1, key: "full" },
                  { ratio: 0.5, key: "half" },
                  { ratio: 0.25, key: "quarter" },
                ].map(({ ratio, key }) => (
                  <Pressable
                    key={key}
                    onPress={() => handleQuickAmount(ratio)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: palette.surfaceContainerLow,
                      borderWidth: 1,
                      borderColor: palette.outlineVariant,
                      alignItems: "center",
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text variant="labelMd" color="onSurface">
                      {t(`studentFeeDetail.paymentModal.${key}`)}
                    </Text>
                    <Text
                      variant="labelSm"
                      color="onSurfaceVariant"
                      style={{ marginTop: 2 }}
                    >
                      {formatCurrency(Math.round(remaining * ratio))}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: amountExceedsRemaining
                    ? palette.error
                    : palette.outlineVariant,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  color: palette.onSurface,
                  marginBottom: spacing.md,
                }}
                value={amount}
                onChangeText={setAmount}
                placeholder={t(
                  "studentFeeDetail.paymentModal.placeholderAmount",
                  { max: formatCurrency(remaining) }
                )}
                placeholderTextColor={palette.onSurfaceVariant}
                keyboardType="decimal-pad"
              />
              {amountExceedsRemaining && (
                <Text
                  variant="labelSm"
                  color="error"
                  style={{ marginTop: -spacing.sm, marginBottom: spacing.md }}
                >
                  {t("studentFeeDetail.paymentModal.amountExceeds")}
                </Text>
              )}
              {itemsWithRemaining.length > 0 && amountNum > 0 && (
                <>
                  <View style={{ marginBottom: spacing.sm }}>
                    <Text variant="labelMd" color="onSurface">
                      {t("studentFeeDetail.paymentModal.splitTitle")}
                    </Text>
                    <Text
                      variant="labelSm"
                      color="onSurfaceVariant"
                      style={{ marginTop: 2 }}
                    >
                      {t("studentFeeDetail.paymentModal.splitHint")}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: spacing.md,
                        marginTop: spacing.xs,
                      }}
                    >
                      <TouchableOpacity
                        onPress={handleAutoAllocate}
                        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                      >
                        <AppIcon
                          name="flash-outline"
                          size="sm"
                          color="primary"
                        />
                        <Text variant="labelMd" color="primary">
                          {t("studentFeeDetail.paymentModal.autoFill")}
                        </Text>
                      </TouchableOpacity>
                      {Object.keys(allocations).length > 0 && (
                        <TouchableOpacity
                          onPress={clearAllocations}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <AppIcon
                            name="close-circle-outline"
                            size="sm"
                            color="onSurfaceVariant"
                          />
                          <Text variant="labelMd" color="onSurfaceVariant">
                            {t("studentFeeDetail.paymentModal.clear")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  {itemsWithRemaining.map((item) => {
                    const itemRemaining =
                      (item.amount ?? 0) - (item.paid_amount ?? 0);
                    return (
                      <View
                        key={item.id}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: spacing.sm,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            variant="labelMd"
                            color="onSurface"
                            numberOfLines={1}
                          >
                            {item.component_name ?? "—"}
                          </Text>
                          <Text
                            variant="labelSm"
                            color="onSurfaceVariant"
                            style={{ marginTop: 2 }}
                          >
                            {t("studentFeeDetail.paymentModal.left", {
                              amount: formatCurrency(itemRemaining),
                            })}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.sm,
                          }}
                        >
                          <TextInput
                            style={{
                              width: 70,
                              borderWidth: 1,
                              borderColor: palette.outlineVariant,
                              borderRadius: radius.sm,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.xs,
                              color: palette.onSurface,
                            }}
                            value={allocations[item.id] ?? ""}
                            onChangeText={(v) =>
                              setAllocations((prev) => ({
                                ...prev,
                                [item.id]: v,
                              }))
                            }
                            placeholder="0"
                            placeholderTextColor={palette.onSurfaceVariant}
                            keyboardType="decimal-pad"
                          />
                          <TouchableOpacity
                            style={{
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.xs,
                              backgroundColor: palette.primary,
                              borderRadius: radius.sm,
                            }}
                            onPress={() => handlePayFullForItem(item)}
                          >
                            <Text variant="labelSm" color="onPrimary">
                              {t("studentFeeDetail.paymentModal.payFull")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                  {useAllocations && allocationMismatch && (
                    <Text
                      variant="labelSm"
                      color="error"
                      style={{ marginBottom: spacing.md }}
                    >
                      {t("studentFeeDetail.paymentModal.allocationMismatch", {
                        sum: formatCurrency(allocationSum),
                        total: formatCurrency(amountNum),
                      })}
                    </Text>
                  )}
                </>
              )}
              <Text
                variant="labelMd"
                color="onSurface"
                style={{ marginBottom: spacing.sm }}
              >
                {t("studentFeeDetail.paymentModal.paymentMethod")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                }}
              >
                {(
                  [
                    { id: "cash", icon: "cash-outline" },
                    { id: "upi", icon: "phone-portrait-outline" },
                    { id: "bank_transfer", icon: "business-outline" },
                    { id: "cheque", icon: "document-text-outline" },
                    { id: "other", icon: "ellipsis-horizontal-outline" },
                  ] as const
                ).map((m) => {
                  const active = method === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMethod(m.id)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        backgroundColor: active
                          ? palette.primary
                          : palette.surfaceContainerLow,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <AppIcon
                        name={m.icon}
                        size="sm"
                        color={active ? "onPrimary" : "onSurfaceVariant"}
                      />
                      <Text
                        variant="labelMd"
                        color={active ? "onPrimary" : "onSurface"}
                      >
                        {t(`studentFeeDetail.paymentMethods.${m.id}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {method === "other" && (
                <>
                  <Text
                    variant="labelMd"
                    color="onSurface"
                    style={{ marginBottom: spacing.sm }}
                  >
                    {t("studentFeeDetail.paymentModal.otherDetailLabel")}
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: palette.outlineVariant,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: palette.onSurface,
                      marginBottom: spacing.md,
                    }}
                    value={otherMethodDetail}
                    onChangeText={setOtherMethodDetail}
                    placeholder={t(
                      "studentFeeDetail.paymentModal.otherDetailPlaceholder"
                    )}
                    placeholderTextColor={palette.onSurfaceVariant}
                  />
                </>
              )}
              <Text
                variant="labelMd"
                color="onSurface"
                style={{ marginBottom: spacing.sm }}
              >
                {method === "cash"
                  ? t("studentFeeDetail.paymentModal.referenceOptional")
                  : t("studentFeeDetail.paymentModal.referenceRequired")}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: palette.outlineVariant,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  color: palette.onSurface,
                  marginBottom: spacing.md,
                }}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder={t(
                  "studentFeeDetail.paymentModal.referencePlaceholder"
                )}
                placeholderTextColor={palette.onSurfaceVariant}
              />
              <Text
                variant="labelMd"
                color="onSurface"
                style={{ marginBottom: spacing.sm }}
              >
                {t("studentFeeDetail.paymentModal.notesOptional")}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: palette.outlineVariant,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  color: palette.onSurface,
                  marginBottom: spacing.md,
                  minHeight: 60,
                }}
                value={notes}
                onChangeText={setNotes}
                placeholder={t(
                  "studentFeeDetail.paymentModal.notesPlaceholder"
                )}
                placeholderTextColor={palette.onSurfaceVariant}
              />
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: palette.outlineVariant,
              }}
            >
              <TouchableOpacity
                style={{ flex: 1, padding: spacing.md, alignItems: "center" }}
                onPress={() => {
                  setPaymentModalOpen(false);
                  setAllocations({});
                  setOtherMethodDetail("");
                }}
              >
                <Text variant="labelMd" color="onSurfaceVariant">
                  {t("studentFeeDetail.paymentModal.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: palette.primary,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  alignItems: "center",
                  opacity:
                    !canSubmitPayment || recordMut.isPending ? 0.7 : 1,
                }}
                onPress={handleRecordPayment}
                disabled={!canSubmitPayment || recordMut.isPending}
              >
                {recordMut.isPending ? (
                  <ActivityIndicator size="small" color={palette.onPrimary} />
                ) : (
                  <Text variant="labelMd" color="onPrimary">
                    {t("studentFeeDetail.paymentModal.record")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PRESERVED: Refund Modal */}
      <Modal visible={refundModalOpen} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View
            style={[
              modalStyles.content,
              { backgroundColor: palette.surface },
            ]}
          >
            <View
              style={[
                modalStyles.header,
                { borderBottomColor: palette.outlineVariant },
              ]}
            >
              <Text variant="headlineMd" color="onSurface">
                {t("studentFeeDetail.refundModal.title")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setRefundModalOpen(false);
                  setRefundPaymentId(null);
                }}
              >
                <AppIcon name="close" size="lg" color="onSurface" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: spacing.lg }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  backgroundColor: palette.errorContainer,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  marginBottom: spacing.lg,
                }}
              >
                <AppIcon name="warning" size="lg" color="error" />
                <Text
                  variant="bodyMd"
                  color="onSurface"
                  style={{ flex: 1, marginLeft: spacing.md }}
                >
                  {t("studentFeeDetail.refundModal.warning")}
                </Text>
              </View>
              <Text
                variant="labelMd"
                color="onSurface"
                style={{ marginBottom: spacing.sm }}
              >
                {t("studentFeeDetail.refundModal.reasonOptional")}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: palette.outlineVariant,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  color: palette.onSurface,
                }}
                value={refundReason}
                onChangeText={setRefundReason}
                placeholder={t(
                  "studentFeeDetail.refundModal.reasonPlaceholder"
                )}
                placeholderTextColor={palette.onSurfaceVariant}
                multiline
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: palette.outlineVariant,
              }}
            >
              <TouchableOpacity
                style={{ flex: 1, padding: spacing.md, alignItems: "center" }}
                onPress={() => {
                  setRefundModalOpen(false);
                  setRefundPaymentId(null);
                }}
              >
                <Text variant="labelMd" color="onSurfaceVariant">
                  {t("studentFeeDetail.paymentModal.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: palette.error,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  alignItems: "center",
                  opacity: refundMut.isPending ? 0.7 : 1,
                }}
                onPress={handleRefund}
                disabled={refundMut.isPending}
              >
                {refundMut.isPending ? (
                  <ActivityIndicator size="small" color={palette.onPrimary} />
                ) : (
                  <Text variant="labelMd" color="onPrimary">
                    {t("studentFeeDetail.refundModal.confirmRefund")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: keyof Palette;
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
      <Text variant="labelMd" color={valueColor ?? "onSurface"} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const STATUS_PILL_ACCENT: Record<string, keyof Palette> = {
  paid: "success",
  partial: "warning",
  overdue: "error",
  success: "success",
  refunded: "onSurfaceVariant",
  failed: "error",
  unpaid: "onSurfaceVariant",
};

function StatusPill({
  status,
  kind = "fee",
}: {
  status: string;
  kind?: "fee" | "payment";
}) {
  const { t } = useTranslation("finance");
  const { palette, spacing, radius } = useTheme();
  const color = palette[STATUS_PILL_ACCENT[status] ?? "onSurfaceVariant"];
  const labelKey =
    kind === "payment"
      ? `paymentTxnStatuses.${status}`
      : `studentFeeStatuses.${status}`;
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
        {t(labelKey, { defaultValue: status })}
      </Text>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
  },
});
