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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/common/theme";
import { LeavePolicy } from "@/modules/teachers/types";
import { leaveTypeColor, LEAVE_TYPE_ICONS } from "../utils/leaveColors";

export interface LeavePolicyModalProps {
  visible: boolean;
  policies: LeavePolicy[];
  policiesLoading: boolean;
  onUpdate: (leaveType: string, field: string, value: any) => void;
  onSave: (leaveType: string) => Promise<void>;
  onClose: () => void;
  editingPolicies: Record<string, Partial<LeavePolicy>>;
}

export function LeavePolicyModal({
  visible,
  policies,
  policiesLoading,
  onUpdate,
  onSave,
  onClose,
  editingPolicies,
}: LeavePolicyModalProps) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, typography } = useTheme();
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = async (leaveType: string) => {
    setSaving(leaveType);
    try {
      await onSave(leaveType);
    } catch (e: any) {
      Alert.alert(t("policyModal.errorTitle"), e.message || t("policyModal.saveFailed"));
    } finally {
      setSaving(null);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.surfaceContainerLowest },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
    },
    title: { ...typography.headlineMd, color: palette.onSurface },
    description: {
      ...typography.bodyMd,
      color: palette.onSurfaceVariant,
      marginBottom: spacing.lg,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    loadingText: { ...typography.bodyMd, color: palette.onSurfaceVariant },
    card: {
      marginBottom: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLow,
      overflow: "hidden",
    },
    cardTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainer,
    },
    typeIcon: { fontSize: 18 },
    typeName: { ...typography.labelMd, fontWeight: "700", letterSpacing: 0.5 },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
    },
    fieldLabel: { ...typography.labelMd, color: palette.onSurface, flex: 1 },
    numInput: {
      width: 72,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      ...typography.bodyMd,
      color: palette.onSurface,
      textAlign: "center",
      backgroundColor: palette.surfaceContainerLowest,
    },
    saveBtn: {
      margin: spacing.md,
      marginTop: spacing.sm,
      backgroundColor: palette.primary,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
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
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={palette.onSurface} />
          </TouchableOpacity>
          <Text style={s.title}>{t("policyModal.title")}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={s.description}>{t("policyModal.description")}</Text>

          {policiesLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={palette.primary} />
              <Text style={s.loadingText}>{t("policyModal.loading")}</Text>
            </View>
          ) : (
            policies.map((policy) => {
              const edits = editingPolicies[policy.leave_type] ?? {};
              const current = { ...policy, ...edits };

              return (
                <View key={policy.leave_type} style={s.card}>
                  <View style={s.cardTitle}>
                    <Text style={s.typeIcon}>{LEAVE_TYPE_ICONS[policy.leave_type]}</Text>
                    <Text
                      style={[s.typeName, { color: leaveTypeColor(policy.leave_type) }]}
                    >
                      {t(`leaveTypes.${policy.leave_type}`, {
                        defaultValue: policy.leave_type,
                      })}
                    </Text>
                  </View>

                  <View style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{t("policyModal.unlimited")}</Text>
                    <Switch
                      value={current.is_unlimited}
                      onValueChange={(v) => onUpdate(policy.leave_type, "is_unlimited", v)}
                      trackColor={{
                        false: palette.outlineVariant,
                        true: palette.primary + "60",
                      }}
                      thumbColor={
                        current.is_unlimited ? palette.primary : palette.onSurfaceVariant
                      }
                    />
                  </View>

                  {!current.is_unlimited && (
                    <View style={s.fieldRow}>
                      <Text style={s.fieldLabel}>{t("policyModal.annualDays")}</Text>
                      <TextInput
                        style={s.numInput}
                        value={String(current.total_days ?? policy.total_days)}
                        onChangeText={(v) =>
                          onUpdate(policy.leave_type, "total_days", parseInt(v, 10) || 0)
                        }
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                  )}

                  <View style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{t("policyModal.allowCarryForward")}</Text>
                    <Switch
                      value={current.is_carry_forward_allowed}
                      onValueChange={(v) =>
                        onUpdate(policy.leave_type, "is_carry_forward_allowed", v)
                      }
                      trackColor={{
                        false: palette.outlineVariant,
                        true: palette.primary + "60",
                      }}
                      thumbColor={
                        current.is_carry_forward_allowed
                          ? palette.primary
                          : palette.onSurfaceVariant
                      }
                    />
                  </View>

                  {current.is_carry_forward_allowed && (
                    <View style={s.fieldRow}>
                      <Text style={s.fieldLabel}>{t("policyModal.maxCarryForward")}</Text>
                      <TextInput
                        style={s.numInput}
                        value={String(
                          current.max_carry_forward_days ?? policy.max_carry_forward_days
                        )}
                        onChangeText={(v) =>
                          onUpdate(
                            policy.leave_type,
                            "max_carry_forward_days",
                            parseInt(v, 10) || 0
                          )
                        }
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                  )}

                  <View style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{t("policyModal.allowNegative")}</Text>
                    <Switch
                      value={current.allow_negative}
                      onValueChange={(v) =>
                        onUpdate(policy.leave_type, "allow_negative", v)
                      }
                      trackColor={{
                        false: palette.outlineVariant,
                        true: palette.warning + "80",
                      }}
                      thumbColor={
                        current.allow_negative ? palette.warning : palette.onSurfaceVariant
                      }
                    />
                  </View>

                  <View style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{t("policyModal.requireReason")}</Text>
                    <Switch
                      value={current.requires_reason}
                      onValueChange={(v) =>
                        onUpdate(policy.leave_type, "requires_reason", v)
                      }
                      trackColor={{
                        false: palette.outlineVariant,
                        true: palette.primary + "60",
                      }}
                      thumbColor={
                        current.requires_reason
                          ? palette.primary
                          : palette.onSurfaceVariant
                      }
                    />
                  </View>

                  <TouchableOpacity
                    style={s.saveBtn}
                    onPress={() => handleSave(policy.leave_type)}
                    disabled={saving === policy.leave_type}
                  >
                    {saving === policy.leave_type ? (
                      <ActivityIndicator size="small" color={palette.onPrimary} />
                    ) : (
                      <Text style={s.saveBtnText}>
                        {t("policyModal.savePolicy", {
                          type: t(`leaveTypes.${policy.leave_type}`, {
                            defaultValue: policy.leave_type,
                          }),
                        })}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
