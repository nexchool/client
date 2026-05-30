import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

export interface DetailRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

/** Icon + label + value row used inside DetailCard (Stitch "Personal Details"). */
export function DetailRow({ icon, label, value }: DetailRowProps) {
  const { palette, spacing, radius, iconSize } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: palette.surfaceContainerLow,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={iconSize.md} color={palette.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelSm" color="onSurfaceVariant">
          {label}
        </Text>
        <Text variant="bodyMd" color="onSurface">
          {value}
        </Text>
      </View>
    </View>
  );
}
