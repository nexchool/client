// client/modules/search/components/SearchResultRow.tsx
import React from 'react';
import { View } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  primary: string;
  secondary?: string | null;
  onPress: () => void;
};

export function SearchResultRow({ icon, primary, secondary, onPress }: Props) {
  const { palette, spacing, radius } = useTheme();
  return (
    <PressScale
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: palette.surfaceContainerHigh ?? palette.surfaceContainer,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={icon} size="md" color="onSurfaceVariant" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" color="onSurface" numberOfLines={1}>
          {primary}
        </Text>
        {secondary ? (
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>
      <AppIcon name="chevron-forward" size="sm" color="onSurfaceVariant" />
    </PressScale>
  );
}
