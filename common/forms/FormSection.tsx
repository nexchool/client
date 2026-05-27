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
          gap: spacing.md,
        },
      ]}
    >
      {title ? (
        <Text style={[typography.headlineMd, { color: palette.onSurface }]}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
