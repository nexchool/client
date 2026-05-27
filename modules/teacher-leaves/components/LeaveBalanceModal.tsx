import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/common/theme";
import { LeaveBalance } from "@/modules/teachers/types";
import { leaveTypeColor, LEAVE_TYPE_ICONS } from "../utils/leaveColors";

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
  const { palette, spacing, radius, typography } = useTheme();
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
    } catch (e: any) {
      Alert.alert(t("balanceModal.errorTitle"), e.message || t("balanceModal.updateFailed"));
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
    backBtn: { padding: 4 },
    title: { ...typography.headlineMd, color: palette.onSurface },
    subtitle: { ...typography.labelMd, color: palette.onSurfaceVariant, marginTop: 2 },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    loadingText: { ...typography.bodyMd, color: palette.onSurfaceVariant },
    balanceRow: {
      flexDirection: "row",
      marginBottom: spacing.lg,
      backgroundColor: palette.surfaceContainerLow,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      overflow: "hidden",
    },
    typeAccent: { width: 4 },
    typeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: spacing.md,
      paddingBottom: 4,
    },
    typeIcon: { fontSize: 16 },
    typeName: { ...typography.labelMd, fontWeight: "700", letterSpacing: 0.5, flex: 1 },
    unlimitedBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: palette.success + "20",
      borderRadius: radius.sm,
    },
    unlimitedText: { ...typography.labelSm, color: palette.success },
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
    statValue: { ...typography.headlineMd, color: palette.onSurface },
    statLabel: {
      ...typography.labelSm,
      color: palette.onSurfaceVariant,
      marginTop: 2,
    },
    carryForward: {
      ...typography.labelSm,
      color: palette.primary,
      paddingHorizontal: spacing.md,
      paddingBottom: 4,
      fontStyle: "italic",
    },
    notes: {
      ...typography.labelSm,
      color: palette.onSurfaceVariant,
      paddingHorizontal: spacing.md,
      paddingBottom: 4,
      fontStyle: "italic",
    },
    adjustBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      margin: spacing.md,
      marginTop: 4,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.primaryContainer + "20",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.primary + "30",
      alignSelf: "flex-start",
    },
    adjustBtnText: { ...typography.labelMd, color: palette.primary, fontWeight: "600" },
    editBox: {
      margin: spacing.md,
      marginTop: 4,
      padding: spacing.md,
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    editLabel: {
      ...typography.labelMd,
      color: palette.onSurface,
      marginBottom: 4,
      marginTop: 8,
    },
    editInput: {
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      ...typography.bodyMd,
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
    cancelEditText: { ...typography.labelMd, color: palette.onSurfaceVariant, fontWeight: "500" },
    saveBtn: {
      flex: 2,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: palette.primary,
      alignItems: "center",
    },
    saveBtnText: { ...typography.labelMd, color: palette.onPrimary, fontWeight: "700" },
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
          <TouchableOpacity onPress={onClose} style={s.backBtn}>
            <Ionicons name="close" size={22} color={palette.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{t("balanceModal.title")}</Text>
            <Text style={s.subtitle}>{teacherName}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {balancesLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={palette.primary} />
              <Text style={s.loadingText}>{t("balanceModal.loading")}</Text>
            </View>
          ) : (
            balances.map((bal) => (
              <View key={bal.leave_type} style={s.balanceRow}>
                <View
                  style={[s.typeAccent, { backgroundColor: leaveTypeColor(bal.leave_type) }]}
                />
                <View style={{ flex: 1 }}>
                  <View style={s.typeHeader}>
                    <Text style={s.typeIcon}>{LEAVE_TYPE_ICONS[bal.leave_type]}</Text>
                    <Text style={[s.typeName, { color: leaveTypeColor(bal.leave_type) }]}>
                      {t(`leaveTypes.${bal.leave_type}`, { defaultValue: bal.leave_type })}
                    </Text>
                    {bal.is_unlimited && (
                      <View style={s.unlimitedBadge}>
                        <Text style={s.unlimitedText}>{t("balanceModal.unlimited")}</Text>
                      </View>
                    )}
                  </View>

                  {!bal.is_unlimited && (
                    <View style={s.statsGrid}>
                      <View style={s.statBox}>
                        <Text style={s.statValue}>
                          {bal.allocated_days + bal.carried_forward_days}
                        </Text>
                        <Text style={s.statLabel}>{t("balanceModal.statTotal")}</Text>
                      </View>
                      <View style={s.statBox}>
                        <Text style={[s.statValue, { color: palette.error }]}>
                          {bal.used_days.toFixed(1)}
                        </Text>
                        <Text style={s.statLabel}>{t("balanceModal.statUsed")}</Text>
                      </View>
                      <View style={s.statBox}>
                        <Text style={[s.statValue, { color: palette.warning }]}>
                          {bal.pending_days.toFixed(1)}
                        </Text>
                        <Text style={s.statLabel}>{t("balanceModal.statPending")}</Text>
                      </View>
                      <View style={s.statBox}>
                        <Text
                          style={[
                            s.statValue,
                            {
                              color:
                                bal.available_days <= 0
                                  ? palette.error
                                  : bal.available_days <= 2
                                  ? palette.warning
                                  : palette.success,
                            },
                          ]}
                        >
                          {bal.available_days.toFixed(1)}
                        </Text>
                        <Text style={s.statLabel}>{t("balanceModal.statAvailable")}</Text>
                      </View>
                    </View>
                  )}

                  {bal.carried_forward_days > 0 && (
                    <Text style={s.carryForward}>
                      {t("balanceModal.carryForward", { days: bal.carried_forward_days })}
                    </Text>
                  )}
                  {bal.notes && (
                    <Text style={s.notes}>
                      {t("balanceModal.notePrefix")}
                      {bal.notes}
                    </Text>
                  )}

                  {!bal.is_unlimited &&
                    (editingType === bal.leave_type ? (
                      <View style={s.editBox}>
                        <Text style={s.editLabel}>{t("balanceModal.setAllocated")}</Text>
                        <TextInput
                          style={s.editInput}
                          value={editDays}
                          onChangeText={setEditDays}
                          keyboardType="numeric"
                          placeholder={String(bal.allocated_days)}
                          placeholderTextColor={palette.onSurfaceVariant}
                        />
                        <Text style={s.editLabel}>{t("balanceModal.adminNote")}</Text>
                        <TextInput
                          style={[s.editInput, { height: 60, textAlignVertical: "top" }]}
                          value={editNotes}
                          onChangeText={setEditNotes}
                          placeholder={t("balanceModal.adminNotePlaceholder")}
                          placeholderTextColor={palette.onSurfaceVariant}
                          multiline
                        />
                        <View style={s.editActions}>
                          <TouchableOpacity
                            style={s.cancelEditBtn}
                            onPress={() => {
                              setEditingType(null);
                              setEditDays("");
                              setEditNotes("");
                            }}
                          >
                            <Text style={s.cancelEditText}>{t("balanceModal.cancel")}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.saveBtn}
                            onPress={handleSave}
                            disabled={saving}
                          >
                            {saving ? (
                              <ActivityIndicator size="small" color={palette.onPrimary} />
                            ) : (
                              <Text style={s.saveBtnText}>{t("balanceModal.save")}</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={s.adjustBtn}
                        onPress={() => {
                          setEditingType(bal.leave_type);
                          setEditDays(String(bal.allocated_days));
                          setEditNotes("");
                        }}
                      >
                        <Ionicons name="create-outline" size={14} color={palette.primary} />
                        <Text style={s.adjustBtnText}>
                          {t("balanceModal.adjustAllocation")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
