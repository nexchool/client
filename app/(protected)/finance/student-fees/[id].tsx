import React, { useState } from "react";
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
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useStudentFee,
  useRecordPayment,
  useRefundPayment,
  useDeleteStudentFee,
} from "@/modules/finance/hooks/useFinance";
import { financeService } from "@/modules/finance/services/financeService";
import type { RecordPaymentInput } from "@/modules/finance/types";
import { calendarLocaleForLanguage } from "@/i18n";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale);
  } catch {
    return s;
  }
}

// Allocation state: { item_id: amount_string }
type AllocationState = Record<string, string>;

export default function StudentFeeDetailPage() {
  const { t, i18n } = useTranslation("finance");
  const locale = calendarLocaleForLanguage(i18n.language ?? "en");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
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
  const amountExceedsRemaining = amountNum > remaining && amount.trim() !== "";
  const allocationSum = itemsWithRemaining.reduce(
    (sum, item) => sum + (parseFloat(allocations[item.id] ?? "0") || 0),
    0
  );
  const useAllocations = allocationSum > 0;
  const allocationMismatch = useAllocations && Math.abs(allocationSum - amountNum) > 0.01;
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

  const handlePayFullForItem = (item: { id: string; amount?: number; paid_amount?: number }) => {
    const itemRemaining = (item.amount ?? 0) - (item.paid_amount ?? 0);
    if (itemRemaining > 0) {
      setAllocations((prev) => {
        const next = { ...prev, [item.id]: String(itemRemaining) };
        const sum = Object.values(next).reduce((s, v) => s + (parseFloat(v) || 0), 0);
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
    if (amt > remaining) {
      return; // Handled by disabled state and inline error
    }
    if (useAllocations && allocationMismatch) {
      Alert.alert(t("common.error"), t("studentFeeDetail.alerts.allocationSum"));
      return;
    }
    try {
      const payload: RecordPaymentInput = {
        student_fee_id: id,
        amount: amt,
        method,
        reference_number: referenceNumber.trim() || undefined,
        method_detail: method === "other" ? otherMethodDetail.trim() : undefined,
        notes: notes || undefined,
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
      Alert.alert(t("common.error"), e?.message ?? t("studentFeeDetail.alerts.recordFailed"));
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
      Alert.alert(t("common.error"), e?.message ?? t("studentFeeDetail.alerts.refundFailed"));
    }
  };

  const handleDownloadInvoice = async () => {
    if (!id) return;
    setDownloading("invoice");
    try {
      const blob = await financeService.downloadInvoicePdf(id);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice_${data?.fee_structure_name?.replace(/\s+/g, "_") ?? id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(t("studentFeeDetail.alerts.pdfInvoiceTitle"), t("studentFeeDetail.alerts.pdfInvoiceBody"));
      }
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("studentFeeDetail.alerts.downloadInvoiceFailed"));
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    setDownloading(paymentId);
    try {
      const blob = await financeService.downloadReceiptPdf(paymentId);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt_${paymentId.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(t("studentFeeDetail.alerts.pdfReceiptTitle"), t("studentFeeDetail.alerts.pdfReceiptBody"));
      }
    } catch (e) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("studentFeeDetail.alerts.downloadReceiptFailed"));
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
                      router.replace("/(protected)/finance/student-fees" as any),
                  },
                ],
                { cancelable: false }
              );
            } catch (e: any) {
              Alert.alert(t("common.error"), e?.message ?? t("studentFeeDetail.alerts.removeFailed"));
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : t("common.failedToLoad")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t("common.notFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("studentFeeDetail.title")}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
      {/* Summary card */}
      <View style={styles.section}>
        <View style={styles.summaryHeaderRow}>
          <Text style={styles.sectionTitle}>{t("studentFeeDetail.summary")}</Text>
          <TouchableOpacity
            onPress={handleRemoveFromStructure}
            style={styles.removeFeeBtn}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.removeFeeBtnText}>{t("studentFeeDetail.removeFromStructure")}</Text>
          </TouchableOpacity>
        </View>
      <View style={styles.card}>
        <Text style={styles.summaryName}>{data.student_name ?? "—"}</Text>
        <Text style={styles.summaryStructure}>{data.fee_structure_name ?? "—"}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("studentFeeDetail.total")}</Text>
          <Text style={[styles.summaryValue, styles.summaryValueFlex]}>
            {formatCurrency(data.total_amount)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("studentFeeDetail.paid")}</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }, styles.summaryValueFlex]}>
            {formatCurrency(data.paid_amount)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("studentFeeDetail.remaining")}</Text>
          <Text style={[styles.summaryValue, { color: Colors.warning }, styles.summaryValueFlex]}>
            {formatCurrency(remaining)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("studentFeeDetail.status")}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  data.status === "paid"
                    ? Colors.success
                    : data.status === "overdue"
                      ? Colors.error
                      : data.status === "partial"
                        ? Colors.warning
                        : Colors.textSecondary,
              },
            ]}
          >
            <Text style={styles.statusText}>{t(`studentFeeStatuses.${data.status}`)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.recordBtn, styles.downloadInvoiceBtn]}
          onPress={handleDownloadInvoice}
          disabled={!!downloading}
        >
          {downloading === "invoice" ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
          )}
          <Text style={styles.downloadInvoiceBtnText}>{t("studentFeeDetail.downloadInvoice")}</Text>
        </TouchableOpacity>
        {remaining > 0 && (
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => setPaymentModalOpen(true)}
          >
            <Ionicons name="card-outline" size={20} color={Colors.background} />
            <Text style={styles.recordBtnText}>{t("studentFeeDetail.recordPayment")}</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>

      {/* Fee items table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("studentFeeDetail.feeItems")}</Text>
        {(data.items ?? []).map((item) => {
          const itemAmount = item.amount ?? 0;
          const itemPaid = item.paid_amount ?? 0;
          const itemRemaining = itemAmount - itemPaid;
          const itemStatus: "paid" | "partial" | "unpaid" =
            itemPaid >= itemAmount ? "paid" : itemPaid > 0 ? "partial" : "unpaid";
          return (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.component_name ?? "—"}</Text>
                <Text style={styles.itemMeta}>
                  {t("studentFeeDetail.itemMeta", {
                    total: formatCurrency(item.amount),
                    paid: formatCurrency(item.paid_amount),
                  })}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemRemaining}>
                  {t("studentFeeDetail.itemLeft", { amount: formatCurrency(itemRemaining) })}
                </Text>
                <View
                  style={[
                    styles.itemStatusBadge,
                    {
                      backgroundColor:
                        itemStatus === "paid"
                          ? Colors.success
                          : itemStatus === "partial"
                            ? Colors.warning
                            : Colors.textSecondary,
                    },
                  ]}
                >
                  <Text style={styles.itemStatusText}>{t(`studentFeeStatuses.${itemStatus}`)}</Text>
                </View>
              </View>
            </View>
          );
        })}
        {(data.items ?? []).length === 0 && (
          <Text style={styles.emptyText}>{t("studentFeeDetail.noFeeItems")}</Text>
        )}
      </View>

      {/* Payment history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("studentFeeDetail.paymentHistory")}</Text>
        {(data.payments ?? []).map((p) => {
          const methodLabel = t(`studentFeeDetail.paymentMethods.${p.method}`, {
            defaultValue: p.method,
          });
          const methodLine =
            p.method === "other" && p.method_detail
              ? `${methodLabel} (${p.method_detail})`
              : methodLabel;
          return (
          <View key={p.id} style={styles.paymentRow}>
            <View style={styles.paymentMain}>
              <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
              <Text style={styles.paymentMeta}>
                {methodLine} • {formatDate(p.created_at, locale)}
                {p.reference_number ? ` • ${p.reference_number}` : ""}
              </Text>
            </View>
            <View style={styles.paymentRight}>
              <View
                style={[
                  styles.paymentStatus,
                  {
                    backgroundColor:
                      p.status === "success"
                        ? Colors.success
                        : p.status === "refunded"
                          ? Colors.textSecondary
                          : Colors.error,
                  },
                ]}
              >
                <Text style={styles.paymentStatusText}>{t(`paymentTxnStatuses.${p.status}`)}</Text>
              </View>
              {p.status === "success" && (
                <>
                  <TouchableOpacity
                    onPress={() => handleDownloadReceipt(p.id)}
                    disabled={!!downloading}
                    style={styles.receiptBtn}
                  >
                    {downloading === p.id ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
                    )}
                    <Text style={styles.receiptBtnText}>{t("studentFeeDetail.receipt")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openRefundModal(p.id)}
                    style={styles.refundBtn}
                  >
                    <Ionicons name="arrow-undo-outline" size={18} color={Colors.error} />
                    <Text style={styles.refundBtnText}>{t("studentFeeDetail.refund")}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        );
        })}
        {(data.payments ?? []).length === 0 && (
          <Text style={styles.emptyText}>{t("studentFeeDetail.noPaymentsYet")}</Text>
        )}
      </View>

      {/* Record Payment Modal */}
      <Modal visible={paymentModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("studentFeeDetail.paymentModal.title")}</Text>
              <TouchableOpacity
                onPress={() => {
                  setPaymentModalOpen(false);
                  setAllocations({});
                  setOtherMethodDetail("");
                }}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.remainingCard}>
                <Text style={styles.remainingLabel}>{t("studentFeeDetail.paymentModal.remainingBalance")}</Text>
                <Text style={styles.remainingAmount}>{formatCurrency(remaining)}</Text>
              </View>
              <Text style={styles.inputLabel}>{t("studentFeeDetail.paymentModal.amount")}</Text>
              <View style={styles.quickAmountRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickAmountBtn,
                    pressed && styles.quickAmountBtnPressed,
                  ]}
                  onPress={() => handleQuickAmount(1)}
                >
                  <Text style={styles.quickAmountBtnText}>{t("studentFeeDetail.paymentModal.full")}</Text>
                  <Text style={styles.quickAmountBtnSub}>{formatCurrency(remaining)}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickAmountBtn,
                    pressed && styles.quickAmountBtnPressed,
                  ]}
                  onPress={() => handleQuickAmount(0.5)}
                >
                  <Text style={styles.quickAmountBtnText}>{t("studentFeeDetail.paymentModal.half")}</Text>
                  <Text style={styles.quickAmountBtnSub}>
                    {formatCurrency(Math.round(remaining * 0.5))}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickAmountBtn,
                    pressed && styles.quickAmountBtnPressed,
                  ]}
                  onPress={() => handleQuickAmount(0.25)}
                >
                  <Text style={styles.quickAmountBtnText}>{t("studentFeeDetail.paymentModal.quarter")}</Text>
                  <Text style={styles.quickAmountBtnSub}>
                    {formatCurrency(Math.round(remaining * 0.25))}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                style={[
                  styles.input,
                  amountExceedsRemaining && styles.inputError,
                ]}
                value={amount}
                onChangeText={setAmount}
                placeholder={t("studentFeeDetail.paymentModal.placeholderAmount", {
                  max: formatCurrency(remaining),
                })}
                keyboardType="decimal-pad"
              />
              {amountExceedsRemaining && (
                <Text style={styles.validationError}>
                  {t("studentFeeDetail.paymentModal.amountExceeds")}
                </Text>
              )}
              {itemsWithRemaining.length > 0 && amountNum > 0 && (
                <>
                  <View style={styles.allocationHeader}>
                    <Text style={styles.inputLabel}>{t("studentFeeDetail.paymentModal.splitTitle")}</Text>
                    <Text style={styles.allocationHint}>
                      {t("studentFeeDetail.paymentModal.splitHint")}
                    </Text>
                    <View style={styles.allocationActions}>
                      <TouchableOpacity
                        onPress={handleAutoAllocate}
                        style={styles.allocationLink}
                      >
                        <Ionicons name="flash-outline" size={16} color={Colors.primary} />
                        <Text style={styles.linkText}>{t("studentFeeDetail.paymentModal.autoFill")}</Text>
                      </TouchableOpacity>
                      {Object.keys(allocations).length > 0 && (
                        <TouchableOpacity onPress={clearAllocations} style={styles.allocationLink}>
                          <Ionicons name="close-circle-outline" size={16} color={Colors.textSecondary} />
                          <Text style={styles.linkTextSecondary}>{t("studentFeeDetail.paymentModal.clear")}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  {itemsWithRemaining.map((item) => {
                    const itemRemaining = (item.amount ?? 0) - (item.paid_amount ?? 0);
                    return (
                      <View key={item.id} style={styles.allocationItemRow}>
                        <View style={styles.allocationItemLeft}>
                          <Text style={styles.allocationItemName} numberOfLines={1}>
                            {item.component_name ?? "—"}
                          </Text>
                          <Text style={styles.allocationItemMeta}>
                            {t("studentFeeDetail.paymentModal.left", {
                              amount: formatCurrency(itemRemaining),
                            })}
                          </Text>
                        </View>
                        <View style={styles.allocationItemRight}>
                          <TextInput
                            style={styles.allocationInput}
                            value={allocations[item.id] ?? ""}
                            onChangeText={(v) =>
                              setAllocations((prev) => ({ ...prev, [item.id]: v }))
                            }
                            placeholder="0"
                            keyboardType="decimal-pad"
                          />
                          <TouchableOpacity
                            style={styles.payFullBtn}
                            onPress={() => handlePayFullForItem(item)}
                          >
                            <Text style={styles.payFullBtnText}>{t("studentFeeDetail.paymentModal.payFull")}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                  {useAllocations && allocationMismatch && (
                    <Text style={styles.validationError}>
                      {t("studentFeeDetail.paymentModal.allocationMismatch", {
                        sum: formatCurrency(allocationSum),
                        total: formatCurrency(amountNum),
                      })}
                    </Text>
                  )}
                </>
              )}
              <Text style={styles.inputLabel}>{t("studentFeeDetail.paymentModal.paymentMethod")}</Text>
              <View style={styles.methodRow}>
                {(
                  [
                    { id: "cash" as const, icon: "cash-outline" },
                    { id: "upi" as const, icon: "phone-portrait-outline" },
                    { id: "bank_transfer" as const, icon: "business-outline" },
                    { id: "cheque" as const, icon: "document-text-outline" },
                    { id: "other" as const, icon: "ellipsis-horizontal-outline" },
                  ] as const
                ).map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.methodChip, method === m.id && styles.methodChipActive]}
                    onPress={() => setMethod(m.id)}
                  >
                    <Ionicons
                      name={m.icon as any}
                      size={18}
                      color={method === m.id ? "#fff" : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.methodChipText,
                        method === m.id && styles.methodChipTextActive,
                      ]}
                    >
                      {t(`studentFeeDetail.paymentMethods.${m.id}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {method === "other" && (
                <>
                  <Text style={styles.inputLabel}>
                    {t("studentFeeDetail.paymentModal.otherDetailLabel")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={otherMethodDetail}
                    onChangeText={setOtherMethodDetail}
                    placeholder={t("studentFeeDetail.paymentModal.otherDetailPlaceholder")}
                  />
                </>
              )}
              <Text style={styles.inputLabel}>
                {method === "cash"
                  ? t("studentFeeDetail.paymentModal.referenceOptional")
                  : t("studentFeeDetail.paymentModal.referenceRequired")}
              </Text>
              <TextInput
                style={styles.input}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder={t("studentFeeDetail.paymentModal.referencePlaceholder")}
              />
              <Text style={styles.inputLabel}>{t("studentFeeDetail.paymentModal.notesOptional")}</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t("studentFeeDetail.paymentModal.notesPlaceholder")}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setPaymentModalOpen(false);
                  setAllocations({});
                  setOtherMethodDetail("");
                }}
              >
                <Text style={styles.cancelBtnText}>{t("studentFeeDetail.paymentModal.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!canSubmitPayment || recordMut.isPending) && styles.submitBtnDisabled,
                ]}
                onPress={handleRecordPayment}
                disabled={!canSubmitPayment || recordMut.isPending}
              >
                {recordMut.isPending ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Text style={styles.submitBtnText}>{t("studentFeeDetail.paymentModal.record")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Refund Confirmation Modal */}
      <Modal visible={refundModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("studentFeeDetail.refundModal.title")}</Text>
              <TouchableOpacity
                onPress={() => {
                  setRefundModalOpen(false);
                  setRefundPaymentId(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.refundWarning}>
                <Ionicons name="warning" size={32} color={Colors.error} />
                <Text style={styles.refundWarningText}>
                  {t("studentFeeDetail.refundModal.warning")}
                </Text>
              </View>
              <Text style={styles.inputLabel}>{t("studentFeeDetail.refundModal.reasonOptional")}</Text>
              <TextInput
                style={styles.input}
                value={refundReason}
                onChangeText={setRefundReason}
                placeholder={t("studentFeeDetail.refundModal.reasonPlaceholder")}
                multiline
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setRefundModalOpen(false);
                  setRefundPaymentId(null);
                }}
              >
                <Text style={styles.cancelBtnText}>{t("studentFeeDetail.paymentModal.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.refundSubmitBtn,
                  refundMut.isPending && styles.submitBtnDisabled,
                ]}
                onPress={handleRefund}
                disabled={refundMut.isPending}
              >
                {refundMut.isPending ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Text style={styles.refundSubmitBtnText}>{t("studentFeeDetail.refundModal.confirmRefund")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1 },
  contentContainer: { paddingBottom: Spacing.xxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backIcon: { padding: Spacing.sm, marginRight: Spacing.sm },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
  section: { padding: Spacing.lg },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: Colors.text, marginBottom: Spacing.md },
  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryName: { fontSize: 20, fontWeight: "700", color: Colors.text },
  summaryStructure: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  summaryLabel: { fontSize: 15, color: Colors.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: "600", color: Colors.text },
  summaryValueFlex: { flex: 1, marginLeft: Spacing.sm, textAlign: "right" },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: Colors.background },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginTop: Spacing.lg,
  },
  recordBtnText: { fontSize: 16, fontWeight: "600", color: Colors.background, marginLeft: Spacing.sm },
  downloadInvoiceBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  downloadInvoiceBtnText: { fontSize: 16, fontWeight: "600", color: Colors.primary, marginLeft: Spacing.sm },
  removeFeeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  removeFeeBtnText: {
    marginLeft: Spacing.xs,
    fontSize: 13,
    color: Colors.error,
    fontWeight: "500",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemMain: {},
  itemName: { fontSize: 15, fontWeight: "500", color: Colors.text },
  itemMeta: { fontSize: 12, color: Colors.textSecondary },
  itemRight: { alignItems: "flex-end", gap: Spacing.xs },
  itemRemaining: { fontSize: 14, color: Colors.warning },
  itemStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  itemStatusText: { fontSize: 11, fontWeight: "600", color: Colors.background },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paymentMain: {},
  paymentAmount: { fontSize: 16, fontWeight: "600", color: Colors.text },
  paymentMeta: { fontSize: 12, color: Colors.textSecondary },
  paymentRight: { alignItems: "flex-end" },
  paymentStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.xs,
  },
  paymentStatusText: { fontSize: 11, fontWeight: "600", color: Colors.background },
  receiptBtn: { flexDirection: "row", alignItems: "center", marginTop: Spacing.xs },
  receiptBtnText: { fontSize: 13, color: Colors.primary, marginLeft: Spacing.xs },
  refundBtn: { flexDirection: "row", alignItems: "center" },
  refundBtnText: { fontSize: 13, color: Colors.error, marginLeft: Spacing.xs },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: Colors.error, fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  modalBody: { padding: Spacing.lg, maxHeight: 420 },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  remainingCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  remainingLabel: { fontSize: 13, color: Colors.textSecondary },
  remainingAmount: { fontSize: 22, fontWeight: "700", color: Colors.warning, marginTop: 2 },
  quickAmountRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickAmountBtnPressed: { opacity: 0.8 },
  quickAmountBtnText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  quickAmountBtnSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  notesInput: { minHeight: 60 },
  validationError: { fontSize: 13, color: Colors.error, marginTop: -Spacing.sm, marginBottom: Spacing.md },
  inputError: { borderColor: Colors.error },
  inputLabel: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: Spacing.sm },
  allocationHeader: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  allocationHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.xs },
  allocationActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.xs },
  allocationLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  linkText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  linkTextSecondary: { fontSize: 14, color: Colors.textSecondary },
  allocationItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  allocationItemLeft: { flex: 1 },
  allocationItemName: { fontSize: 14, fontWeight: "500", color: Colors.text },
  allocationItemMeta: { fontSize: 12, color: Colors.textSecondary },
  allocationItemRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  allocationInput: {
    width: 70,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: 14,
    color: Colors.text,
  },
  payFullBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.sm,
  },
  payFullBtnText: { fontSize: 12, fontWeight: "600", color: Colors.background },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  methodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
  },
  methodChipActive: { backgroundColor: Colors.primary },
  methodChipText: { fontSize: 14, color: Colors.text },
  methodChipTextActive: { fontSize: 14, color: Colors.background, fontWeight: "600" },
  cancelBtn: { flex: 1, padding: Spacing.md, alignItems: "center" },
  cancelBtnText: { fontSize: 16, color: Colors.textSecondary },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "600", color: Colors.background },
  refundWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,59,48,0.1)",
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.lg,
  },
  refundWarningText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  refundSubmitBtn: {
    flex: 1,
    backgroundColor: Colors.error,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  refundSubmitBtnText: { fontSize: 16, fontWeight: "600", color: Colors.background },
});
