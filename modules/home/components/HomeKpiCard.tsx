import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PressScale } from '@/common/components/PressScale';

type AccentToken = 'primary' | 'tertiary' | 'secondary' | 'error' | 'success';

type Props = {
  label: string;
  value: string;
  accent: AccentToken;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgToken?: keyof Palette;
  secondaryText?: string;
  secondaryIcon?: keyof typeof Ionicons.glyphMap;
  secondaryColor?: keyof Palette;
  rightSlot?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

const ACCENT_MAP: Record<AccentToken, keyof Palette> = {
  primary: 'primary',
  tertiary: 'tertiary',
  secondary: 'secondary',
  error: 'error',
  success: 'success',
};

export function HomeKpiCard({
  label,
  value,
  accent,
  iconName,
  iconBgToken = 'primaryContainer',
  secondaryText,
  secondaryIcon,
  secondaryColor,
  rightSlot,
  onPress,
  style,
}: Props) {
  const { palette, spacing, radius, elevation } = useTheme();
  const accentColor = palette[ACCENT_MAP[accent]];
  const iconBg = palette[iconBgToken];

  const inner = (
    <View
      style={[
        styles.card,
        elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        },
        style,
      ]}
    >
      <View style={[styles.topRow, { gap: spacing.sm }]}>
        <View
          style={[
            styles.iconChip,
            { backgroundColor: iconBg, borderRadius: radius.md },
          ]}
        >
          <AppIcon name={iconName} size="md" color="onSurface" />
        </View>
        <Text
          variant="overline"
          color="onSurfaceVariant"
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <View style={[styles.bottomRow, { marginTop: spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
            {value}
          </Text>
          {secondaryText ? (
            <View style={[styles.secondaryRow, { marginTop: 4, gap: 4 }]}>
              {secondaryIcon ? (
                <AppIcon
                  name={secondaryIcon}
                  size="sm"
                  color={secondaryColor ?? 'onSurfaceVariant'}
                />
              ) : null}
              <Text
                variant="labelSm"
                color={secondaryColor ?? 'onSurfaceVariant'}
                numberOfLines={1}
              >
                {secondaryText}
              </Text>
            </View>
          ) : null}
        </View>
        {rightSlot ? <View>{rightSlot}</View> : null}
      </View>
    </View>
  );

  if (onPress) {
    return <PressScale onPress={onPress}>{inner}</PressScale>;
  }
  return inner;
}

const styles = StyleSheet.create({
  card: { flex: 1, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconChip: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  secondaryRow: { flexDirection: 'row', alignItems: 'center' },
});
