import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Palette } from '@/common/theme';

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
  const { palette, spacing, radius, typography, elevation } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        !dashed && elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.md,
          gap: spacing.md,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.92 : 1,
        },
        dashed && {
          borderWidth: 1,
          borderColor: palette.outlineVariant,
          borderStyle: 'dashed',
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: palette[iconBgToken] },
        ]}
      >
        <Ionicons name={iconName} size={22} color={palette[iconFgToken]} />
      </View>
      <Text
        style={[
          typography.labelMd,
          { color: dashed ? palette.onSurfaceVariant : palette.onSurface },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, alignItems: 'flex-start' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
