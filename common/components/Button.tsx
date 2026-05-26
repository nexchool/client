import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/common/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  children: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
};

const HEIGHT: Record<Size, number> = { sm: 40, md: 48, lg: 56 };

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
}: Props) {
  const { palette, radius, spacing, typography } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? palette.primary
      : variant === 'secondary'
      ? `${palette.primary}1A` // 10% alpha
      : variant === 'destructive'
      ? palette.error
      : 'transparent';

  const labelColor =
    variant === 'primary'
      ? palette.onPrimary
      : variant === 'destructive'
      ? palette.onError
      : palette.primary;

  const handlePress = () => {
    if (isDisabled || !onPress) return;
    if (variant === 'primary' && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          height: HEIGHT[size],
          paddingHorizontal: spacing.lg,
          borderRadius: radius.DEFAULT,
          opacity: isDisabled ? 0.4 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={{ marginRight: spacing.sm }}>{leftIcon}</View> : null}
          <Text
            style={[
              typography.labelMd,
              {
                color: labelColor,
                fontFamily: 'Inter_600SemiBold',
                includeFontPadding: false,
              },
            ]}
          >
            {children}
          </Text>
          {rightIcon ? <View style={{ marginLeft: spacing.sm }}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
