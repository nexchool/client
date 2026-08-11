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
  | 'labelSm'
  | 'titleSm'
  | 'bodySm'
  | 'labelLg'
  | 'overline';

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
  titleSm: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 24 },
  bodySm: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  labelLg: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 24 },
  overline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
};

/**
 * How far each role may grow when the phone is set to Larger Text.
 *
 * Not a rejection of the setting — a parent who turned it on needs it, and
 * `Text` honours it. But iOS scales to 3.1x and Android to 2x, and at either
 * of those a label in a 32pt chip is gone. Each cap is roughly where that
 * role's line stops fitting the chrome built around it.
 *
 * Prose that has room to reflow gets the most: `bodyLg`/`bodyMd` are read, not
 * scanned, and a paragraph growing by half is a paragraph, not a broken row.
 * The dense roles get least — `overline` and `labelSm` sit inside chips, table
 * headers and tab bars whose height is set by the design, not by the text.
 *
 * `display` barely moves because it is already 32pt: at 1.15 it is 37pt, which
 * is as much as a phone-width heading takes before it wraps to three lines.
 */
export const FontScaleCap: Record<TypeRole, number> = {
  display: 1.15,
  headlineLg: 1.2,
  headlineMd: 1.25,
  titleSm: 1.3,
  bodyLg: 1.5,
  bodyMd: 1.5,
  bodySm: 1.4,
  labelLg: 1.3,
  labelMd: 1.3,
  labelSm: 1.2,
  overline: 1.15,
};

export const Typography = base;
export type { TypeRole };
