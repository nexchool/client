import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";

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
  const { palette, spacing, radius } = useTheme();

  const s = StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
      flexWrap: "wrap",
    },
    rejectBtn: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: "transparent",
      paddingVertical: spacing.sm,
      borderRadius: radius.DEFAULT,
      borderWidth: 1,
      borderColor: palette.error,
      minWidth: 90,
    },
    approveBtn: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: palette.primary,
      paddingVertical: spacing.sm,
      borderRadius: radius.DEFAULT,
      minWidth: 90,
    },
    balanceBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.DEFAULT,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLow,
    },
  });

  return (
    <View style={s.container}>
      <PressScale style={s.rejectBtn} onPress={onReject}>
        <AppIcon name="close-circle-outline" size="sm" color="error" />
        <Text variant="labelMd" color="error">
          {t("screen.reject")}
        </Text>
      </PressScale>
      <PressScale style={s.approveBtn} onPress={onApprove}>
        <AppIcon name="checkmark-circle-outline" size="sm" color="onPrimary" />
        <Text variant="labelMd" color="onPrimary">
          {t("screen.approve")}
        </Text>
      </PressScale>
      {showBalance && onOpenBalance && (
        <PressScale style={s.balanceBtn} onPress={onOpenBalance}>
          <AppIcon name="wallet-outline" size="sm" color="primary" />
          <Text variant="labelMd" color="primary">
            {t("screen.balance")}
          </Text>
        </PressScale>
      )}
    </View>
  );
}
