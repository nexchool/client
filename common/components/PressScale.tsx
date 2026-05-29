import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/common/theme';

export interface PressScaleProps extends Omit<PressableProps, 'style'> {
  /** Style for the Pressable (layout). */
  style?: StyleProp<ViewStyle>;
  /** Optional override of the pressed scale (defaults to motion.interaction.pressScale). */
  scaleTo?: number;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressScale({ style, scaleTo, children, onPressIn, onPressOut, ...rest }: PressScaleProps) {
  const { motion } = useTheme();
  const target = scaleTo ?? motion.interaction.pressScale;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withTiming(target, { duration: motion.duration.fast, easing: motion.easing.standard });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: motion.duration.fast, easing: motion.easing.standard });
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
