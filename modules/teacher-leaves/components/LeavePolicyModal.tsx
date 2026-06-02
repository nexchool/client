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
  Switch,
} from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { LeavePolicy } from "@/modules/teachers/types";
import { leaveTypeAccentToken, LEAVE_TYPE_ICONS } from "../utils/leaveColors";

type PolicyFieldValue = boolean | number;

export interface LeavePolicyModalProps {
  visible: boolean;
  policies: LeavePolicy[];
  policiesLoading: boolean;
  onUpdate: (leaveType: string, field: string, value: PolicyFieldValue) => void;
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
  const { palette, spacing, radius, typography: { bodyMd: bodyMdType } } = useTheme();
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = async (leaveType: string) => {
    setSaving(leaveType);
    try {
      await onSave(leaveType);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("policyModal.saveFailed");
      Alert.alert(t("policyModal.errorTitle"), msg);
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
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
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
      gap: spacing.sm,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainer,
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: palette.outlineVariant,
    },
    numInput: {
      width: 72,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      ...bodyMdType,
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
          <Text variant="headlineMd" color="onSurface">
            {t("policyModal.title")}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text variant="bodyMd" color="onSurfaceVariant" style={{ marginBottom: spacing.lg }}>
            {t("policyModal.description")}
          </Text>

          {policiesLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={palette.primary} />
              <Text variant="bodyMd" color="onSurfaceVariant">
                {t("policyModal.loading")}
              </Text>
            </View>
          ) : (
            policies.map((policy) => {
              const edits = editingPolicies[policy.leave_type] ?? {};
              const current = { ...policy, ...edits };
              const typeAccent = leaveTypeAccentToken(policy.leave_type);

              return (
                <View key={policy.leave_type} style={s.card}>
                  <View style={s.cardTitle}>
                    <AppIcon
                      name={LEAVE_TYPE_ICONS[policy.leave_type] ?? "document-text-outline"}
                      size="md"
                      color={typeAccent}
                    />
                    <Text variant="labelMd" color={typeAccent}>
                      {t(`leaveTypes.${policy.leave_type}`, { defaultValue: policy.leave_type })}
                    </Text>
                  </View>

                  <View style={s.fieldRow}>
                    <Text variant="labelMd" color="onSurface" style={{ flex: 1 }}>
                      {t("policyModal.unlimited")}
                    </Text>
                    <Switch
                      value={current.is_unlimited}
                      onValueChange={(v) => onUpdate(policy.leave_type, "is_unlimited", v)}
                      trackColor={{ false: palette.outlineVariant, true: palette.primaryContainer }}
                      thumbColor={current.is_unlimited ? palette.primary : palette.onSurfaceVariant}
                    />
                  </View>

                  {!current.is_unlimited && (
                    <View style={s.fieldRow}>
                      <Text variant="labelMd" color="onSurface" style={{ flex: 1 }}>
                        {t("policyModal.annualDays")}
                      </Text>
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
                    <Text variant="labelMd" color="onSurface" style={{ flex: 1 }}>
                      {t("policyModal.allowCarryForward")}
                    </Text>
                    <Switch
                      value={current.is_carry_forward_allowed}
                      onValueChange={(v) =>
                        onUpdate(policy.leave_type, "is_carry_forward_allowed", v)
                      }
                      trackColor={{ false: palette.outlineVariant, true: palette.primaryContainer }}
                      thumbColor={
                        current.is_carry_forward_allowed ? palette.primary : palette.onSurfaceVariant
                      }
                    />
                  </View>

                  {current.is_carry_forward_allowed && (
                    <View style={s.fieldRow}>
                      <Text variant="labelMd" color="onSurface" style={{ flex: 1 }}>
                        {t("policyModal.maxCarryForward")}
                      </Text>
                      <TextInput
                        style={s.numInput}
                        value={String(
                          current.max_carry_forward_days ?? policy.max_carry_forward_days
                        )}
                        onChangeText={(v) =>
                          onUpdate(policy.leave_type, "max_carry_forward_days", parseInt(v, 10) || 0)
                        }
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                    </View>
                  )}

                  <View style={s.fieldRow}>
                    <Text variant="labelMd" color="onSurface" style={{ flex: 1 }}>
                      {t("policyModal.allowNegative")}
                    </Text>
                    <Switch
                      value={current.allow_negative}
                      onValueChange={(v) => onUpdate(policy.leave_type, "allow_negative", v)}
                      trackColor={{ false: palette.outlineVariant, true: palette.warning }}
                      thumbColor={current.allow_negative ? palette.warning : palette.onSurfaceVariant}
                    />
                  </View>

                  <View style={s.fieldRow}>
                    <Text variant="labelMd" color="onSurface" style={{ flex: 1 }}>
                      {t("policyModal.requireReason")}
                    </Text>
                    <Switch
                      value={current.requires_reason}
                      onValueChange={(v) => onUpdate(policy.leave_type, "requires_reason", v)}
                      trackColor={{ false: palette.outlineVariant, true: palette.primaryContainer }}
                      thumbColor={current.requires_reason ? palette.primary : palette.onSurfaceVariant}
                    />
                  </View>

                  <PressScale
                    style={s.saveBtn}
                    onPress={() => handleSave(policy.leave_type)}
                    disabled={saving === policy.leave_type}
                  >
                    {saving === policy.leave_type ? (
                      <ActivityIndicator size="small" color={palette.onPrimary} />
                    ) : (
                      <Text variant="labelMd" color="onPrimary">
                        {t("policyModal.savePolicy", {
                          type: t(`leaveTypes.${policy.leave_type}`, {
                            defaultValue: policy.leave_type,
                          }),
                        })}
                      </Text>
                    )}
                  </PressScale>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
