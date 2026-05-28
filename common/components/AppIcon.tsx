import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import type { IconSizeKey } from '@/common/theme';

type ColorKey = keyof ReturnType<typeof useTheme>['palette'];

export interface AppIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  /** Icon size token. Default 'md' (20). */
  size?: IconSizeKey;
  /** Palette color key. Default 'onSurface'. */
  color?: ColorKey;
  /** When set, wraps in a Pressable with hitSlop padded toward the min touch target. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function AppIcon({ name, size = 'md', color = 'onSurface', onPress, style, accessibilityLabel }: AppIconProps) {
  const { iconSize, palette, touchTarget } = useTheme();
  const px = iconSize[size];
  const glyph = <Ionicons name={name} size={px} color={palette[color]} />;
  if (!onPress) return glyph;
  const slop = Math.max(0, Math.round((touchTarget.min - px) / 2));
  return (
    <Pressable onPress={onPress} hitSlop={slop} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={style}>
      {glyph}
    </Pressable>
  );
}
