/**
 * Inter typography scale for the nexchool design system.
 * Returns ready-to-spread RN style objects per role. Consumers do NOT pass
 * fontWeight separately — it's encoded in the fontFamily string.
 *
 * Inter weights loaded in app/_layout.tsx via @expo-google-fonts/inter:
 *  - Inter_400Regular
 *  - Inter_500Medium
 *  - Inter_600SemiBold
 *  - Inter_700Bold
 */

import type { TextStyle } from 'react-native';

type TypeRole =
  | 'display'
  | 'headlineLg'
  | 'headlineMd'
  | 'bodyLg'
  | 'bodyMd'
  | 'labelMd'
  | 'labelSm';

const base: Record<TypeRole, TextStyle> = {
  display: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64, // -0.02em * 32px
  },
  headlineLg: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
  },
  headlineMd: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  labelMd: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.14, // 0.01em * 14px
  },
  labelSm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
  },
};

export const Typography = base;
export type { TypeRole };
