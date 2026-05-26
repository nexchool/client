import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/common/theme';

type Props = {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width, height, radius, style }: Props) {
  const { palette, radius: themeRadius } = useTheme();
  const r = radius ?? themeRadius.DEFAULT;
  const progress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, [progress, reduceMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 300 - 150 }],
  }));

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius: r, backgroundColor: palette.surfaceContainerHigh },
        style,
      ]}
    >
      {!reduceMotion && (
        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', `${palette.surfaceContainerLowest}99`, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  shimmer: { ...StyleSheet.absoluteFillObject, width: 150 },
});
