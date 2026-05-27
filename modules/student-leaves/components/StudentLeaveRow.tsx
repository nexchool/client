// client/modules/student-leaves/components/StudentLeaveRow.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import type { StudentLeave } from '../types';

type Props = {
  leave: StudentLeave;
  onPress: (leave: StudentLeave) => void;
  showStudentName?: boolean;
};

const STATUS_LABEL: Record<StudentLeave['status'], string> = {
  pending_class_teacher: 'Pending teacher',
  pending_admin: 'Pending admin',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export function StudentLeaveRow({ leave, onPress, showStudentName }: Props) {
  const { palette, spacing, radius, typography, elevation } = useTheme();

  const statusBg =
    leave.status === 'approved' ? `${palette.success}22`
    : leave.status === 'rejected' ? `${palette.error}22`
    : leave.status === 'cancelled' ? `${palette.outlineVariant}66`
    : `${palette.warning}22`;
  const statusFg =
    leave.status === 'approved' ? palette.success
    : leave.status === 'rejected' ? palette.error
    : leave.status === 'cancelled' ? palette.onSurfaceVariant
    : palette.warning;

  return (
    <Pressable
      onPress={() => onPress(leave)}
      style={({ pressed }) => ({
        backgroundColor: palette.surfaceContainerLowest,
        borderRadius: radius.xl,
        padding: spacing.lg,
        gap: spacing.sm,
        opacity: pressed ? 0.9 : 1,
        ...elevation.card,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[typography.labelMd, { color: palette.onSurface, textTransform: 'capitalize' }]}>
          {leave.leave_type}
        </Text>
        <View style={{ backgroundColor: statusBg, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full }}>
          <Text style={[typography.labelSm, { color: statusFg }]}>{STATUS_LABEL[leave.status]}</Text>
        </View>
      </View>
      {showStudentName && leave.student_name ? (
        <Text style={[typography.bodyMd, { color: palette.onSurface }]}>{leave.student_name}</Text>
      ) : null}
      <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
        {leave.start_date} – {leave.end_date}
        {leave.half_day ? ` (${leave.half_day.toUpperCase()})` : ''}
      </Text>
      <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]} numberOfLines={2}>
        {leave.reason}
      </Text>
      {leave.cancel_requested_at ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={14} color={palette.warning} />
          <Text style={[typography.labelSm, { color: palette.warning }]}>Cancellation pending</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
