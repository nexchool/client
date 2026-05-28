/**
 * Motion tokens for the nexchool design system.
 * Durations in ms; easing presets; standard interaction constants.
 */
import { Easing } from 'react-native-reanimated';

export const Duration = { fast: 120, base: 200, slow: 320 } as const;
export const Easings = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
} as const;
export const Interaction = { pressScale: 0.97 } as const;
export type DurationKey = keyof typeof Duration;
