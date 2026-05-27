import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';
import type { WeeklyPeriod } from '../types';

type Props = {
  period: WeeklyPeriod | null;
  width: number;
  height: number;
  isCurrent?: boolean;
  secondaryField: 'class' | 'teacher' | 'room';
  onPress?: () => void;
};

export function WeeklyGridCell({
  period,
  width,
  height,
  isCurrent = false,
  secondaryField,
  onPress,
}: Props) {
  const { palette, spacing, radius, typography } = useTheme();
  if (!period) {
    return (
      <View
        style={[
          styles.cell,
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
  const secondaryText =
    secondaryField === 'teacher'
      ? period.teacher?.name
      : secondaryField === 'room'
      ? period.room
      : period.class_section?.name;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          width,
          height,
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.md,
          padding: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {isCurrent ? (
        <View style={[styles.dot, { backgroundColor: palette.primary }]} />
      ) : null}
      <Text style={[typography.labelMd, { color: palette.onSurface }]} numberOfLines={1}>
        {period.subject?.name ?? '—'}
      </Text>
      {secondaryText ? (
        <Text
          style={[typography.labelSm, { color: palette.onSurfaceVariant, marginTop: 2 }]}
          numberOfLines={1}
        >
          {secondaryText}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { overflow: 'hidden' },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
