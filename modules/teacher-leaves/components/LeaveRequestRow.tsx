import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/common/theme";
import { Text } from "@/common/components/Text";
import { AppIcon } from "@/common/components/AppIcon";
import { PressScale } from "@/common/components/PressScale";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { TeacherLeave } from "@/modules/teachers/types";
import {
  statusAccentToken,
  leaveTypeAccentToken,
  LEAVE_TYPE_ICONS,
} from "../utils/leaveColors";
import { ApproveRejectActions } from "./ApproveRejectActions";

export interface LeaveRequestRowProps {
  leave: TeacherLeave;
  canManage: boolean;
  onApprove: (leave: TeacherLeave) => void;
  onReject: (leave: TeacherLeave) => void;
  onOpenBalance: (leave: TeacherLeave) => void;
}

/**
 * Single leave-request row: avatar + teacher name, leave type/dates/reason,
 * status pill, and (when permitted) approve / reject / balance actions.
 * Left accent bar reflects the request status (Stitch "Pending Requests" card).
 */
export function LeaveRequestRow({
  leave,
  canManage,
  onApprove,
  onReject,
  onOpenBalance,
}: LeaveRequestRowProps) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, elevation } = useTheme();

  const leaveTypeLabel = (type: string) =>
    t(`leaveTypes.${type}`, { defaultValue: type });
  const statusLabel = (status: string) =>
    t(`status.${status}`, { defaultValue: status });

  const statusAccent = statusAccentToken(leave.status);
  const typeAccent = leaveTypeAccentToken(leave.leave_type);
  const typeIcon = LEAVE_TYPE_ICONS[leave.leave_type] ?? "document-text-outline";

  const s = StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.xl,
      borderLeftWidth: 4,
      borderLeftColor: palette[statusAccent],
      backgroundColor: palette.surfaceContainerLowest,
      gap: spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    teacherInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: palette.surfaceContainer,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    typePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.DEFAULT,
      backgroundColor: palette.surfaceContainerLow,
    },
    detailRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  });

  return (
    <View style={[s.card, elevation.card]}>
      <View style={s.headerRow}>
        <View style={s.teacherInfo}>
          <ProfileAvatar
            uri={leave.teacher_profile_picture}
            size={40}
            name={leave.teacher_name}
            iconColor={palette.primary}
            placeholderBg={palette.surfaceContainerHigh}
          />
          <View style={{ flex: 1 }}>
            <Text variant="labelLg" color="onSurface" numberOfLines={1}>
              {leave.teacher_name ?? "—"}
            </Text>
            {leave.teacher_employee_id ? (
              <Text variant="labelSm" color="onSurfaceVariant">
                #{leave.teacher_employee_id}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={s.statusBadge}>
          <Text variant="labelSm" color={statusAccent}>
            {statusLabel(leave.status)}
          </Text>
        </View>
      </View>

      <View style={s.metaRow}>
        <View style={s.typePill}>
          <AppIcon name={typeIcon} size="sm" color={typeAccent} />
          <Text variant="labelSm" color={typeAccent}>
            {leaveTypeLabel(leave.leave_type)}
          </Text>
        </View>
        <View style={s.detailRow}>
          <AppIcon name="calendar-outline" size="sm" color="onSurfaceVariant" />
          <Text variant="labelMd" color="onSurfaceVariant">
            {t("screen.dateRange", { start: leave.start_date, end: leave.end_date })}
          </Text>
        </View>
        {leave.working_days != null ? (
          <Text variant="labelSm" color="onSurfaceVariant">
            {t("screen.workingDaysShort", { count: leave.working_days })}
          </Text>
        ) : null}
      </View>

      {leave.reason ? (
        <Text variant="bodyMd" color="onSurface" style={{ fontStyle: "italic" }}>
          {leave.reason}
        </Text>
      ) : null}

      <Text variant="labelSm" color="onSurfaceVariant">
        {t("screen.applied", { date: leave.created_at.slice(0, 10) })}
      </Text>

      {canManage && leave.status === "pending" ? (
        <ApproveRejectActions
          onApprove={() => onApprove(leave)}
          onReject={() => onReject(leave)}
          onOpenBalance={() => onOpenBalance(leave)}
          showBalance
        />
      ) : canManage ? (
        <View style={{ flexDirection: "row", marginTop: spacing.xs }}>
          <PressScale
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radius.DEFAULT,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              backgroundColor: palette.surfaceContainerLow,
            }}
            onPress={() => onOpenBalance(leave)}
          >
            <AppIcon name="wallet-outline" size="sm" color="primary" />
            <Text variant="labelMd" color="primary">
              {t("screen.balance")}
            </Text>
          </PressScale>
        </View>
      ) : null}
    </View>
  );
}
