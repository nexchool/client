/**
 * @deprecated Use `useTheme()` from `@/common/theme` and read tokens from
 * `palette.*`. This shim re-exports semantic equivalents so unrefactored
 * screens keep compiling during the nexchool design-system migration.
 * Will be deleted once all consumers are migrated.
 */
import { lightPalette } from '@/common/theme';

export const Colors = {
  primary: lightPalette.primary,
  primaryDark: lightPalette.primary,
  primaryLight: lightPalette.primaryContainer,

  background: lightPalette.surface,
  backgroundSecondary: lightPalette.surfaceContainerLow,
  backgroundTertiary: lightPalette.surfaceContainer,

  text: lightPalette.onSurface,
  textSecondary: lightPalette.onSurfaceVariant,
  textTertiary: lightPalette.outline,

  success: lightPalette.success,
  error: lightPalette.error,
  warning: lightPalette.warning,
  info: lightPalette.primary,

  border: lightPalette.outlineVariant,
  borderLight: lightPalette.outlineVariant,

  shadow: 'rgba(11, 28, 48, 0.10)',
  shadowLight: 'rgba(11, 28, 48, 0.05)',
  overlay: 'rgba(11, 28, 48, 0.40)',
} as const;
