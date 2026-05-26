/**
 * Semantic color palettes for the nexchool design system.
 * Light palette is active in Slice 1; dark palette ships for forward-compat
 * but is not activated until the Settings dark-mode toggle slice.
 *
 * Values from Stitch "Academic Fluidity" design.md.
 */

export type Palette = {
  // Surfaces
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  outline: string;
  outlineVariant: string;
  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  // Status
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  warning: string;
};

export const lightPalette: Palette = {
  surface: '#f8f9ff',
  surfaceDim: '#cbdbf5',
  surfaceBright: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dce9ff',
  surfaceContainerHighest: '#d3e4fe',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#464554',
  inverseSurface: '#213145',
  inverseOnSurface: '#eaf1ff',
  outline: '#767586',
  outlineVariant: '#c7c4d7',
  primary: '#4648d4',
  onPrimary: '#ffffff',
  primaryContainer: '#6063ee',
  onPrimaryContainer: '#fffbff',
  secondary: '#006591',
  onSecondary: '#ffffff',
  secondaryContainer: '#39b8fd',
  onSecondaryContainer: '#004666',
  tertiary: '#6b38d4',
  onTertiary: '#ffffff',
  tertiaryContainer: '#8455ef',
  onTertiaryContainer: '#fffbff',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  success: '#34C759',
  warning: '#FF9500',
};

// Dark palette structure exists for forward-compat; values are placeholders
// derived from Stitch dark-mode references. Activation lands in a later slice.
export const darkPalette: Palette = {
  surface: '#0b1220',
  surfaceDim: '#0b1220',
  surfaceBright: '#1a2536',
  surfaceContainerLowest: '#05080f',
  surfaceContainerLow: '#0f1828',
  surfaceContainer: '#142033',
  surfaceContainerHigh: '#1a283e',
  surfaceContainerHighest: '#21314a',
  onSurface: '#e2e9f7',
  onSurfaceVariant: '#a8b0c4',
  inverseSurface: '#eaf1ff',
  inverseOnSurface: '#0b1c30',
  outline: '#5e6577',
  outlineVariant: '#3b4257',
  primary: '#c0c1ff',
  onPrimary: '#07006c',
  primaryContainer: '#2f2ebe',
  onPrimaryContainer: '#e1e0ff',
  secondary: '#89ceff',
  onSecondary: '#001e2f',
  secondaryContainer: '#004c6e',
  onSecondaryContainer: '#c9e6ff',
  tertiary: '#d0bcff',
  onTertiary: '#23005c',
  tertiaryContainer: '#5516be',
  onTertiaryContainer: '#e9ddff',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  success: '#34C759',
  warning: '#FF9500',
};
