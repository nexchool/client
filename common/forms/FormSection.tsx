import React, { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/common/theme';

type Props = {
  title?: string;
  children: ReactNode;
};

export function FormSection({ title, children }: Props) {
  const { palette, spacing, radius, typography, elevation } = useTheme();
  return (
    <View
      style={[
        elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
        },
      ]}
    >
      {title ? (
        <Text style={[typography.headlineMd, { color: palette.onSurface, marginBottom: spacing.xs }]}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
