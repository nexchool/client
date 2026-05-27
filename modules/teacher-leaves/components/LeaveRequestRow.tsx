import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/common/theme";
import { ProfileAvatar } from "@/common/components/ProfileAvatar";
import { TeacherLeave } from "@/modules/teachers/types";
import { statusColor, leaveTypeColor, LEAVE_TYPE_ICONS } from "../utils/leaveColors";
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
 */
export function LeaveRequestRow({
  leave,
  canManage,
  onApprove,
  onReject,
  onOpenBalance,
}: LeaveRequestRowProps) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, typography } = useTheme();

  const leaveTypeLabel = (type: string) =>
    t(`leaveTypes.${type}`, { defaultValue: type });
  const statusLabel = (status: string) =>
    t(`status.${status}`, { defaultValue: status });

  const s = StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
      backgroundColor: palette.surfaceContainerLowest,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    teacherInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    teacherName: { ...typography.bodyMd, fontWeight: "600", color: palette.onSurface },
    employeeId: {
      ...typography.labelSm,
      color: palette.onSurfaceVariant,
      marginTop: 1,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.md,
    },
    statusText: { ...typography.labelSm, fontWeight: "600" },
    leaveDetails: { gap: 6, marginBottom: spacing.sm },
    detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    detailText: { ...typography.labelMd, color: palette.onSurfaceVariant },
    reasonText: { fontStyle: "italic", flex: 1 },
    workingDaysTag: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      backgroundColor: palette.surfaceContainer,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: palette.outlineVariant,
    },
    workingDaysText: {
      ...typography.labelSm,
      fontWeight: "600",
      color: palette.onSurfaceVariant,
    },
  });

  const itemStatusColor = statusColor(leave.status, palette);

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.teacherInfo}>
          <ProfileAvatar
            uri={leave.teacher_profile_picture}
            size={36}
            name={leave.teacher_name}
            iconColor={palette.primary}
            placeholderBg={palette.primary + "25"}
            style={{ marginRight: spacing.sm }}
          />
          <View>
            <Text style={s.teacherName}>{leave.teacher_name ?? "—"}</Text>
            {leave.teacher_employee_id ? (
              <Text style={s.employeeId}>#{leave.teacher_employee_id}</Text>
            ) : null}
          </View>
        </View>
        <View style={[s.statusBadge, { backgroundColor: itemStatusColor + "20" }]}>
          <Text style={[s.statusText, { color: itemStatusColor }]}>
            {statusLabel(leave.status)}
          </Text>
        </View>
      </View>

      <View style={s.leaveDetails}>
        <View style={s.detailRow}>
          <Text style={{ fontSize: 13 }}>
            {LEAVE_TYPE_ICONS[leave.leave_type] ?? "📋"}
          </Text>
          <Text
            style={[
              s.detailText,
              { color: leaveTypeColor(leave.leave_type), fontWeight: "600" },
            ]}
          >
            {leaveTypeLabel(leave.leave_type)}
          </Text>
          {leave.working_days != null && (
            <View style={s.workingDaysTag}>
              <Text style={s.workingDaysText}>
                {t("screen.workingDaysShort", { count: leave.working_days })}
              </Text>
            </View>
          )}
        </View>
        <View style={s.detailRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={palette.onSurfaceVariant}
          />
          <Text style={s.detailText}>
            {t("screen.dateRange", { start: leave.start_date, end: leave.end_date })}
          </Text>
        </View>
        {leave.reason ? (
          <View style={s.detailRow}>
            <Ionicons
              name="chatbubble-outline"
              size={14}
              color={palette.onSurfaceVariant}
            />
            <Text style={[s.detailText, s.reasonText]}>{leave.reason}</Text>
          </View>
        ) : null}
        <View style={s.detailRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={palette.onSurfaceVariant}
          />
          <Text style={s.detailText}>
            {t("screen.applied", { date: leave.created_at.slice(0, 10) })}
          </Text>
        </View>
      </View>

      {canManage && leave.status === "pending" ? (
        <ApproveRejectActions
          onApprove={() => onApprove(leave)}
          onReject={() => onReject(leave)}
          onOpenBalance={() => onOpenBalance(leave)}
          showBalance
        />
      ) : canManage ? (
        <BalanceOnly onPress={() => onOpenBalance(leave)} />
      ) : null}
    </View>
  );
}

function BalanceOnly({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation("teacherLeaves");
  const { palette, spacing, radius, typography } = useTheme();

  const s = StyleSheet.create({
    wrap: { flexDirection: "row", marginTop: spacing.sm },
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
    <View style={s.wrap}>
      <TouchableOpacity style={s.balanceBtn} onPress={onPress}>
        <Ionicons name="wallet-outline" size={14} color={palette.primary} />
        <Text style={s.balanceBtnText}>{t("screen.balance")}</Text>
      </TouchableOpacity>
    </View>
  );
}
