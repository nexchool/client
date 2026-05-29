import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';

type Props = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgToken: keyof Palette;
  iconFgToken: keyof Palette;
  onPress: () => void;
  dashed?: boolean;
};

export function HomeQuickActionCard({
  label,
  iconName,
  iconBgToken,
  iconFgToken,
  onPress,
  dashed = false,
}: Props) {
  const { palette, spacing, radius, elevation } = useTheme();
  return (
    <PressScale
      onPress={onPress}
      style={[
        styles.fill,
        styles.card,
        !dashed && elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.md,
          gap: spacing.md,
        },
        dashed && {
          borderWidth: 1,
          borderColor: palette.outlineVariant,
          borderStyle: 'dashed',
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: palette[iconBgToken] }]}>
        <AppIcon name={iconName} size="md" color={iconFgToken} />
      </View>
      <Text
        variant="labelMd"
        color={dashed ? 'onSurfaceVariant' : 'onSurface'}
        numberOfLines={2}
      >
        {label}
      </Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  card: { flex: 1, alignItems: 'flex-start' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
