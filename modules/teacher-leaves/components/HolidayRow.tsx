// client/modules/teacher-leaves/components/HolidayRow.tsx
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { formatDate } from '@/common/utils/datetime';
import type { Holiday } from '@/modules/holidays/types';

/** A stable colour per holiday, so the same festival looks the same each year. */
const ACCENTS: (keyof Palette)[] = ['primary', 'secondary', 'tertiary', 'success', 'warning'];

function holidayAccent(name: string): keyof Palette {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * One holiday. Same card shape as the leave rows beside it — flat surface,
 * `radius.xl`, no hairline border, elevation for depth.
 */
export function HolidayRow({ holiday }: { holiday: Holiday }) {
  const { t } = useTranslation(['teacherLeaves', 'holidays']);
  const { palette, spacing, radius, elevation } = useTheme();

  const accent = holidayAccent(holiday.name);
  const dateLabel = holiday.is_recurring
    ? (holiday.recurring_day_name ??
       t('tracker.holidayRow.weeklyOff', { defaultValue: 'Weekly off' }))
    : holiday.is_single_day
      ? formatDate(holiday.start_date)
      : `${formatDate(holiday.start_date)} – ${formatDate(holiday.end_date)}`;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: palette.surfaceContainerLowest,
          gap: spacing.md,
        },
        elevation.card,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: palette[accent],
        }}
      >
        <Text variant="labelSm" color="onPrimary">
          {initials(holiday.name)}
        </Text>
      </View>

      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text variant="labelLg" color="onSurface" numberOfLines={2}>
          {holiday.name}
        </Text>
        <Text variant="bodySm" color="onSurfaceVariant">
          {dateLabel}
        </Text>
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: radius.DEFAULT,
            backgroundColor: palette.surfaceContainerLow,
          }}
        >
          <Text variant="labelSm" color="onSurfaceVariant">
            {/* Holiday vocabulary belongs to the holidays namespace. */}
            {t(`holidays:form.types.${holiday.holiday_type}`)}
          </Text>
        </View>
      </View>
    </View>
  );
}
