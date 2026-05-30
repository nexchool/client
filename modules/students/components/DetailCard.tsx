import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import type { Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';

export interface DetailCardProps {
  title: string;
  /** Left accent stripe color token. Default 'secondaryContainer'. */
  accent?: keyof Palette;
  children: React.ReactNode;
}

/** Rounded card with a left accent stripe + title (Stitch detail cards). */
export function DetailCard({ title, accent = 'secondaryContainer', children }: DetailCardProps) {
  const { palette, spacing, radius, elevation } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderLeftWidth: 4,
          borderLeftColor: palette[accent],
          marginBottom: spacing.lg,
        },
        elevation.card,
      ]}
    >
      <Text variant="headlineMd" color="onSurface" style={{ marginBottom: spacing.md }}>
        {title}
      </Text>
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
  );
}
