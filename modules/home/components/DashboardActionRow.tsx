import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';

type IconName = keyof typeof Ionicons.glyphMap;

export interface DashboardActionRowProps {
  title: string;
  subtitle: string;
  iconName: IconName;
  /** Palette token for the icon chip background. */
  iconChipBg: keyof Palette;
  /** Palette token for the icon glyph color. */
  iconChipFg: keyof Palette;
  onPress: () => void;
}

export function DashboardActionRow({
  title,
  subtitle,
  iconName,
  iconChipBg,
  iconChipFg,
  onPress,
}: DashboardActionRowProps) {
  const { palette, spacing, radius } = useTheme();

  return (
    <PressScale onPress={onPress}>
      <View style={[styles.row, { gap: spacing.md, paddingVertical: spacing.md }]}>
        <View
          style={[
            styles.iconChip,
            { backgroundColor: palette[iconChipBg], borderRadius: radius.lg, padding: spacing.sm },
          ]}
        >
          <AppIcon name={iconName} size="lg" color={iconChipFg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="labelLg" color="onSurface" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <AppIcon name="chevron-forward" size="sm" color="onSurfaceVariant" />
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconChip: { alignItems: 'center', justifyContent: 'center' },
});
