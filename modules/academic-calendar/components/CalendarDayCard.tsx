import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { StatusPill } from '@/common/components/StatusPill';
import { ENTRY_ACCENTS, ENTRY_ICONS, type CalendarEntryKind } from '../types';

export interface CalendarDayCardProps {
  kind: CalendarEntryKind;
  title: string;
  /** The type label — "Public holiday", "Mid term" — or null. */
  badge?: string | null;
  subtitle?: string | null;
}

/**
 * One thing happening on the selected day.
 *
 * The same card anatomy as `HolidayListItem` — name on the first line, a
 * detail line under it, the type as a pill, the accent on the left edge —
 * minus its edit and delete icons, because this surface is read-only.
 */
export function CalendarDayCard({ kind, title, badge, subtitle }: CalendarDayCardProps) {
  const { palette, spacing, radius, elevation } = useTheme();
  const accent = ENTRY_ACCENTS[kind];

  return (
    <View
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
      <View style={[styles.row, { gap: spacing.sm }]}>
        <AppIcon
          name={ENTRY_ICONS[kind] as React.ComponentProps<typeof Ionicons>['name']}
          size="lg"
          color={accent}
        />
        <Text variant="labelLg" color="onSurface" style={styles.flex}>
          {title}
        </Text>
      </View>

      {subtitle ? (
        <Text variant="labelSm" color="onSurfaceVariant">
          {subtitle}
        </Text>
      ) : null}

      {badge ? (
        <View style={styles.badges}>
          <StatusPill label={badge} tone={accent} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  badges: { flexDirection: 'row' },
});
