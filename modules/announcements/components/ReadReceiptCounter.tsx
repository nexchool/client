import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

type Props = { readCount: number; totalCount: number };

export function ReadReceiptCounter({ readCount, totalCount }: Props) {
  const { palette, spacing, radius } = useTheme();
  const pct = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;
  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: palette.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: palette.outlineVariant,
        gap: spacing.xs,
      }}
    >
      <Text variant="labelSm" color="onSurfaceVariant">Read receipts</Text>
      <Text variant="headlineMd" color="onSurface">
        {readCount} / {totalCount}
      </Text>
      <Text variant="labelSm" color="onSurfaceVariant">{pct}% read</Text>
    </View>
  );
}
