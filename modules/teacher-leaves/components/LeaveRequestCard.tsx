// client/modules/teacher-leaves/components/LeaveRequestCard.tsx
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import { StatusPill } from '@/common/components/StatusPill';
import { formatDate } from '@/common/utils/datetime';
import { statusAccentToken } from '../utils/leaveColors';
import type { TeacherLeave } from '@/modules/teachers/types';

type Props = {
  leave: TeacherLeave;
  onPress?: (leave: TeacherLeave) => void;
  /** Omitted for a leave that can no longer be withdrawn. */
  onCancel?: (leave: TeacherLeave) => void;
};

/**
 * One leave request, in the same card the student module uses: flat 4px left
 * accent, no border, elevation for depth. The version this replaces drew a
 * hairline border and its own pill, so the two leave screens in one app did
 * not look like the same product.
 */
export function LeaveRequestCard({ leave, onPress, onCancel }: Props) {
  const { t } = useTranslation('teacherLeaves');
  const { palette, spacing, radius, elevation } = useTheme();
  const accent = statusAccentToken(leave.status);

  return (
    <PressScale
      onPress={onPress ? () => onPress(leave) : undefined}
      disabled={!onPress}
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
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Text variant="labelMd" color="onSurface">
          {t(`leaveTypes.${leave.leave_type}`, { defaultValue: leave.leave_type })}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <StatusPill
            label={t(`status.${leave.status}`, { defaultValue: leave.status })}
            tone={accent}
          />
          {onCancel ? (
            <AppIcon
              name="trash-outline"
              size="lg"
              color="error"
              onPress={() => onCancel(leave)}
              accessibilityLabel={t('tracker.leaveRow.cancel', { defaultValue: 'Cancel request' })}
            />
          ) : null}
        </View>
      </View>

      <Text variant="labelSm" color="onSurfaceVariant">
        {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
        {/* `leaveRow.day` / `leaveRow.days` are bare nouns in this namespace,
            not counted sentences — the number goes in front of them. */}
        {leave.working_days != null
          ? ` · ${leave.working_days} ${
              leave.working_days === 1
                ? t('tracker.leaveRow.day', { defaultValue: 'Day' })
                : t('tracker.leaveRow.days', { defaultValue: 'Days' })
            }`
          : ''}
      </Text>

      {leave.reason ? (
        <Text variant="bodyMd" color="onSurfaceVariant" numberOfLines={2}>
          {leave.reason}
        </Text>
      ) : null}
    </PressScale>
  );
}
