import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/common/theme';
import type { Palette } from '@/common/theme';

export interface ProgressRingProps {
  /** Percentage 0-100. */
  value: number;
  /** Diameter in px. */
  size: number;
  /** Stroke width. Default 3. */
  stroke?: number;
  /** Track color token. Default 'surfaceContainerHighest'. */
  trackColor?: keyof Palette;
  /** Progress color token. Default 'primary'. */
  progressColor?: keyof Palette;
}

/** Reusable SVG progress ring shared by Student and Admin home dashboards. */
export function ProgressRing({
  value,
  size,
  stroke = 3,
  trackColor = 'surfaceContainerHighest',
  progressColor = 'primary',
}: ProgressRingProps) {
  const { palette } = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={palette[trackColor]}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={palette[progressColor]}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}
