// client/modules/student-leaves/components/StudentLeaveRow.tsx
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { StatusPill } from '@/common/components/StatusPill';
import { formatDate } from '@/common/utils/datetime';
import { statusAccent, statusLabelKey } from '../constants';
import type { StudentLeave } from '../types';

type Props = {
  leave: StudentLeave;
  onPress: (leave: StudentLeave) => void;
  showStudentName?: boolean;
};

export function StudentLeaveRow({ leave, onPress, showStudentName }: Props) {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius, elevation } = useTheme();
  const accent = statusAccent(leave.status);

  // Calendar dates go through the school clock. `new Date(iso)` on a
  // `YYYY-MM-DD` renders the day before for anyone west of the school.
  const dateRange = `${formatDate(leave.start_date)} – ${formatDate(leave.end_date)}`;

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
        <StatusPill label={t(statusLabelKey(leave.status))} tone={accent} />
      </View>
      {showStudentName && leave.student_name ? (
        <Text variant="bodyMd" color="onSurface">
          {leave.student_name}
        </Text>
      ) : null}
      <Text variant="labelSm" color="onSurfaceVariant">
        {dateRange}
        {leave.half_day ? ` (${leave.half_day.toUpperCase()})` : ''}
      </Text>
      <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={2}>
        {leave.reason}
      </Text>
      {leave.cancel_requested_at ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AppIcon name="time-outline" size="sm" color="warning" />
          <Text variant="labelSm" color="warning">
            {t('detail.cancelPending', {
              defaultValue: 'Cancellation is awaiting class teacher review.',
            })}
          </Text>
        </View>
      ) : null}
    </PressScale>
  );
}
