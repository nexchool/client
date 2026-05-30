import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';

export interface ProfileActionRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  /** Trailing node; defaults to a forward chevron. Pass null to hide. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Renders label + icon in the error color (e.g. Sign out). */
  destructive?: boolean;
}

/** Standalone list row: icon chip + label + chevron, wrapped in PressScale. */
export function ProfileActionRow({
  icon,
  label,
  hint,
  trailing,
  onPress,
  destructive,
}: ProfileActionRowProps) {
  const { palette, spacing, radius, elevation } = useTheme();
  const labelColor = destructive ? 'error' : 'onSurface';
  const chipBg = destructive ? palette.errorContainer : palette.surfaceContainerLow;
  const iconColor = destructive ? 'error' : 'primary';

  return (
    <PressScale
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.lg,
        },
        elevation.card,
      ]}
    >
      <View style={[styles.chip, { backgroundColor: chipBg, borderRadius: radius.full }]}>
        <AppIcon name={icon} size="lg" color={iconColor} />
      </View>
      <View style={styles.body}>
        <Text variant="bodyLg" color={labelColor} numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text variant="labelSm" color="onSurfaceVariant" numberOfLines={1} style={{ marginTop: 2 }}>
            {hint}
          </Text>
        ) : null}
      </View>
      {trailing === undefined ? (
        <AppIcon name="chevron-forward" size="md" color="onSurfaceVariant" />
      ) : (
        trailing
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chip: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
});
