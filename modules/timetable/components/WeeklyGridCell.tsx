import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';
import type { WeeklyPeriod } from '../types';

type Props = {
  period: WeeklyPeriod | null;
  width: number;
  height: number;
  isCurrent?: boolean;
  /** Accent color key for the left bar — cycles per subject. */
  accent?: 'primary' | 'secondary' | 'tertiary';
  secondaryField: 'class' | 'teacher' | 'room';
  onPress?: () => void;
};

function initialOf(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function WeeklyGridCell({
  period,
  width,
  height,
  isCurrent = false,
  accent = 'primary',
  secondaryField,
  onPress,
}: Props) {
  const { palette, spacing, radius } = useTheme();
  if (!period) {
    return (
      <View
        style={[
          styles.empty,
          {
            width,
            height,
            backgroundColor: palette.surfaceContainerLow,
            borderRadius: radius.md,
          },
        ]}
      />
    );
  }

  const accentColor = palette[accent];
  const secondaryText =
    secondaryField === 'teacher'
      ? period.teacher?.name
      : secondaryField === 'room'
        ? period.room
        : period.class?.name;

  return (
    <PressScale
      onPress={onPress}
      style={[
        styles.cell,
        {
          width,
          height,
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.md,
          borderLeftWidth: 3,
          borderLeftColor: isCurrent ? palette.primary : accentColor,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          gap: 2,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text
          variant="labelMd"
          color={isCurrent ? 'primary' : 'onSurface'}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {period.subject?.name ?? '—'}
        </Text>
        {isCurrent ? (
          <View style={[styles.dot, { backgroundColor: palette.primary }]} />
        ) : null}
      </View>
      <View style={styles.metaRow}>
        <AppIcon name="time-outline" size="sm" color="onSurfaceVariant" />
        <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ flex: 1 }}>
          {period.start_time}
        </Text>
      </View>
      {secondaryText ? (
        <View style={styles.metaRow}>
          {secondaryField === 'teacher' ? (
            <View style={[styles.avatar, { backgroundColor: palette.tertiaryContainer }]}>
              <Text variant="labelSm" color="onTertiaryContainer">
                {initialOf(secondaryText)}
              </Text>
            </View>
          ) : (
            <AppIcon
              name={secondaryField === 'room' ? 'location-outline' : 'school-outline'}
              size="sm"
              color="onSurfaceVariant"
            />
          )}
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ flex: 1 }}>
            {secondaryText}
          </Text>
        </View>
      ) : null}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  empty: { overflow: 'hidden' },
  cell: { overflow: 'hidden' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
