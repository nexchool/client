import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { LeaveBalance } from "@/modules/teachers/types";
import { leaveTypeAccentToken, LEAVE_TYPE_ICONS } from "../utils/leaveColors";

export interface LeaveBalanceModalProps {
  visible: boolean;
  teacherName: string;
  balances: LeaveBalance[];
  balancesLoading: boolean;
  onAdjust: (leaveType: string, days: number, notes: string) => Promise<void>;
  onClose: () => void;
}

export function LeaveBalanceModal({
  visible,
  teacherName,
  balances,
  balancesLoading,
  onAdjust,
  onClose,
}: LeaveBalanceModalProps) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, typography: { bodyMd: bodyMdType } } = useTheme();
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editDays, setEditDays] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editingType) return;
    const days = parseInt(editDays, 10);
    if (isNaN(days) || days < 0) {
      Alert.alert(t("balanceModal.validationTitle"), t("balanceModal.validationDays"));
      return;
    }
    setSaving(true);
    try {
      await onAdjust(editingType, days, editNotes);
      setEditingType(null);
      setEditDays("");
      setEditNotes("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("balanceModal.updateFailed");
      Alert.alert(t("balanceModal.errorTitle"), msg);
    } finally {
      setSaving(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.surfaceContainerLowest },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    balanceRow: {
      flexDirection: "row",
      marginBottom: spacing.lg,
      backgroundColor: palette.surfaceContainerLow,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    typeAccent: { width: 4 },
    typeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.md,
      paddingBottom: spacing.xs,
    },
    unlimitedBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      backgroundColor: palette.surfaceContainer,
      borderRadius: radius.sm,
    },
    statsGrid: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    statBox: {
      flex: 1,
      alignItems: "center",
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
    },
    adjustBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      margin: spacing.md,
      marginTop: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surfaceContainerLow,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      alignSelf: "flex-start",
    },
    editBox: {
      margin: spacing.md,
      marginTop: spacing.xs,
      padding: spacing.md,
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    editInput: {
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      ...bodyMdType,
      color: palette.onSurface,
      backgroundColor: palette.surfaceContainerLowest,
    },
    editActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
    cancelEditBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      alignItems: "center",
    },
    saveBtn: {
      flex: 2,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: palette.primary,
      alignItems: "center",
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onDismiss={onClose}
    >
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <AppIcon name="close" size="lg" color="onSurface" onPress={onClose} />
          <View style={{ flex: 1 }}>
            <Text variant="headlineMd" color="onSurface">
              {t("balanceModal.title")}
            </Text>
            <Text variant="labelMd" color="onSurfaceVariant">
              {teacherName}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {balancesLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={palette.primary} />
              <Text variant="bodyMd" color="onSurfaceVariant">
                {t("balanceModal.loading")}
              </Text>
            </View>
          ) : (
            balances.map((bal) => {
              const typeAccent = leaveTypeAccentToken(bal.leave_type);
              const availColor: "error" | "warning" | "success" =
                bal.available_days <= 0 ? "error" : bal.available_days <= 2 ? "warning" : "success";
              return (
                <View key={bal.leave_type} style={s.balanceRow}>
                  <View style={[s.typeAccent, { backgroundColor: palette[typeAccent] }]} />
                  <View style={{ flex: 1 }}>
                    <View style={s.typeHeader}>
                      <AppIcon
                        name={LEAVE_TYPE_ICONS[bal.leave_type] ?? "document-text-outline"}
                        size="md"
                        color={typeAccent}
                      />
                      <Text variant="labelMd" color={typeAccent} style={{ flex: 1 }}>
                        {t(`leaveTypes.${bal.leave_type}`, { defaultValue: bal.leave_type })}
                      </Text>
                      {bal.is_unlimited ? (
                        <View style={s.unlimitedBadge}>
                          <Text variant="labelSm" color="success">
                            {t("balanceModal.unlimited")}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {!bal.is_unlimited && (
                      <View style={s.statsGrid}>
                        <View style={s.statBox}>
                          <Text variant="headlineMd" color="onSurface">
                            {bal.allocated_days + bal.carried_forward_days}
                          </Text>
                          <Text variant="labelSm" color="onSurfaceVariant">
                            {t("balanceModal.statTotal")}
                          </Text>
                        </View>
                        <View style={s.statBox}>
                          <Text variant="headlineMd" color="error">
                            {bal.used_days.toFixed(1)}
                          </Text>
                          <Text variant="labelSm" color="onSurfaceVariant">
                            {t("balanceModal.statUsed")}
                          </Text>
                        </View>
                        <View style={s.statBox}>
                          <Text variant="headlineMd" color="warning">
                            {bal.pending_days.toFixed(1)}
                          </Text>
                          <Text variant="labelSm" color="onSurfaceVariant">
                            {t("balanceModal.statPending")}
                          </Text>
                        </View>
                        <View style={s.statBox}>
                          <Text variant="headlineMd" color={availColor}>
                            {bal.available_days.toFixed(1)}
                          </Text>
                          <Text variant="labelSm" color="onSurfaceVariant">
                            {t("balanceModal.statAvailable")}
                          </Text>
                        </View>
                      </View>
                    )}

                    {bal.carried_forward_days > 0 && (
                      <Text
                        variant="labelSm"
                        color="primary"
                        style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xs, fontStyle: "italic" }}
                      >
                        {t("balanceModal.carryForward", { days: bal.carried_forward_days })}
                      </Text>
                    )}
                    {bal.notes ? (
                      <Text
                        variant="labelSm"
                        color="onSurfaceVariant"
                        style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xs, fontStyle: "italic" }}
                      >
                        {t("balanceModal.notePrefix")}
                        {bal.notes}
                      </Text>
                    ) : null}

                    {!bal.is_unlimited &&
                      (editingType === bal.leave_type ? (
                        <View style={s.editBox}>
                          <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs, marginTop: spacing.sm }}>
                            {t("balanceModal.setAllocated")}
                          </Text>
                          <TextInput
                            style={s.editInput}
                            value={editDays}
                            onChangeText={setEditDays}
                            keyboardType="numeric"
                            placeholder={String(bal.allocated_days)}
                            placeholderTextColor={palette.onSurfaceVariant}
                          />
                          <Text variant="labelMd" color="onSurface" style={{ marginBottom: spacing.xs, marginTop: spacing.sm }}>
                            {t("balanceModal.adminNote")}
                          </Text>
                          <TextInput
                            style={[s.editInput, { height: 60, textAlignVertical: "top" }]}
                            value={editNotes}
                            onChangeText={setEditNotes}
                            placeholder={t("balanceModal.adminNotePlaceholder")}
                            placeholderTextColor={palette.onSurfaceVariant}
                            multiline
                          />
                          <View style={s.editActions}>
                            <PressScale
                              style={s.cancelEditBtn}
                              onPress={() => {
                                setEditingType(null);
                                setEditDays("");
                                setEditNotes("");
                              }}
                            >
                              <Text variant="labelMd" color="onSurfaceVariant">
                                {t("balanceModal.cancel")}
                              </Text>
                            </PressScale>
                            <PressScale style={s.saveBtn} onPress={handleSave} disabled={saving}>
                              {saving ? (
                                <ActivityIndicator size="small" color={palette.onPrimary} />
                              ) : (
                                <Text variant="labelMd" color="onPrimary">
                                  {t("balanceModal.save")}
                                </Text>
                              )}
                            </PressScale>
                          </View>
                        </View>
                      ) : (
                        <PressScale
                          style={s.adjustBtn}
                          onPress={() => {
                            setEditingType(bal.leave_type);
                            setEditDays(String(bal.allocated_days));
                            setEditNotes("");
                          }}
                        >
                          <AppIcon name="create-outline" size="sm" color="primary" />
                          <Text variant="labelMd" color="primary">
                            {t("balanceModal.adjustAllocation")}
                          </Text>
                        </PressScale>
                      ))}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
