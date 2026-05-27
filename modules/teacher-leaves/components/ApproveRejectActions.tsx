import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/common/theme";

export interface ApproveRejectActionsProps {
  onApprove: () => void;
  onReject: () => void;
  onOpenBalance?: () => void;
  showBalance?: boolean;
}

/**
 * Approve / Reject buttons cluster used in the leave-request row.
 * Reject confirmation (and reject reason prompt) is handled by the parent
 * via `onReject` callback — see `TeacherLeavesScreen.handleReject`.
 */
export function ApproveRejectActions({
  onApprove,
  onReject,
  onOpenBalance,
  showBalance,
}: ApproveRejectActionsProps) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, typography } = useTheme();

  const s = StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
      flexWrap: "wrap",
    },
    approveBtn: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
      backgroundColor: palette.success + "15",
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.success + "40",
      minWidth: 90,
    },
    approveBtnText: { ...typography.labelMd, color: palette.success, fontWeight: "600" },
    rejectBtn: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
      backgroundColor: palette.error + "15",
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.error + "40",
      minWidth: 90,
    },
    rejectBtnText: { ...typography.labelMd, color: palette.error, fontWeight: "600" },
    balanceBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: palette.primary + "30",
      backgroundColor: palette.primaryContainer + "20",
    },
    balanceBtnText: { ...typography.labelMd, color: palette.primary, fontWeight: "600" },
  });

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.approveBtn} onPress={onApprove}>
        <Ionicons name="checkmark-circle-outline" size={16} color={palette.success} />
        <Text style={s.approveBtnText}>{t("screen.approve")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.rejectBtn} onPress={onReject}>
        <Ionicons name="close-circle-outline" size={16} color={palette.error} />
        <Text style={s.rejectBtnText}>{t("screen.reject")}</Text>
      </TouchableOpacity>
      {showBalance && onOpenBalance && (
        <TouchableOpacity style={s.balanceBtn} onPress={onOpenBalance}>
          <Ionicons name="wallet-outline" size={14} color={palette.primary} />
          <Text style={s.balanceBtnText}>{t("screen.balance")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
