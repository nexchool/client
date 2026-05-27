import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/common/theme';

type Props = { readCount: number; totalCount: number };

export function ReadReceiptCounter({ readCount, totalCount }: Props) {
  const { palette, spacing, radius, typography } = useTheme();
  const pct = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;
  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: palette.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: palette.outlineVariant,
        gap: 4,
      }}
    >
      <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>Read receipts</Text>
      <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
        {readCount} / {totalCount}
      </Text>
      <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>{pct}% read</Text>
    </View>
  );
}
