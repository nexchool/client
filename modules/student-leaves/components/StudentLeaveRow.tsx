// client/modules/student-leaves/components/StudentLeaveRow.tsx
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { statusAccent } from '../constants';
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
  const { palette, spacing, radius, elevation } = useTheme();
  const accent = statusAccent(leave.status);

  return (
    <PressScale
      onPress={() => onPress(leave)}
      style={[
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
          borderLeftWidth: 4,
          borderLeftColor: palette[accent],
        },
        elevation.card,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="labelMd" color="onSurface" style={{ textTransform: 'capitalize' }}>
          {leave.leave_type}
        </Text>
        <View
          style={{
            backgroundColor: palette.surfaceContainer,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radius.full,
            marginLeft: spacing.sm,
          }}
        >
          <Text variant="labelSm" color={accent}>
            {STATUS_LABEL[leave.status]}
          </Text>
        </View>
      </View>
      {showStudentName && leave.student_name ? (
        <Text variant="bodyMd" color="onSurface">
          {leave.student_name}
        </Text>
      ) : null}
      <Text variant="labelSm" color="onSurfaceVariant">
        {leave.start_date} – {leave.end_date}
        {leave.half_day ? ` (${leave.half_day.toUpperCase()})` : ''}
      </Text>
      <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={2}>
        {leave.reason}
      </Text>
      {leave.cancel_requested_at ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AppIcon name="time-outline" size="sm" color="warning" />
          <Text variant="labelSm" color="warning">
            Cancellation pending
          </Text>
        </View>
      ) : null}
    </PressScale>
  );
}
