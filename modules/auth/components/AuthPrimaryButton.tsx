import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontScaleCap, shade, useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';

type Props = {
  children: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

/**
 * The sign-in card's primary call to action — a gradient button with a
 * trailing arrow, per the design spec. Deliberately its own component rather
 * than a new `Button` variant: `Button` is used across the whole app for
 * every primary action, and giving every one of those a gradient (or adding
 * a gradient-only code path most callers never use) would be a much bigger,
 * riskier change than this screen asked for. Mirrors `Button`'s primary-path
 * API (loading/disabled/fullWidth) so it drops in at the same call sites.
 *
 * The gradient is a small, same-hue shift — `[primary, shade(primary, 0.18)]`
 * — not the band's large dark sweep. `onPrimary` (the M3 pairing for the raw
 * `primary` swatch) needs to stay legible across the whole button, and a big
 * shade shift risks losing contrast at one end; an 18% darken does not.
 */
export function AuthPrimaryButton({ children, onPress, loading = false, disabled = false, fullWidth = false }: Props) {
  const { palette, radius, spacing } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: fullWidth ? '100%' : undefined,
        opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1,
        transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
      })}
    >
      <LinearGradient
        colors={[palette.primary, shade(palette.primary, 0.18)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 52,
          borderRadius: radius[14],
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: spacing.lg,
        }}
      >
        {loading ? (
          <ActivityIndicator color={palette.onPrimary} size="small" />
        ) : (
          <>
            <Text maxFontSizeMultiplier={FontScaleCap.labelLg} variant="labelLg" color="onPrimary">
              {children}
            </Text>
            <View style={{ marginLeft: spacing.sm }}>
              <Ionicons name="arrow-forward" size={18} color={palette.onPrimary} />
            </View>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}
