/**
 * @deprecated Use `useTheme().spacing` and `useTheme().radius` from
 * `@/common/theme`. This shim re-exports the same numeric scale so
 * unrefactored screens keep compiling during the migration.
 */
import { Spacing as ThemeSpacing, Radius } from '@/common/theme';

export const Spacing = {
  xs: ThemeSpacing.xs,
  sm: ThemeSpacing.sm,
  md: ThemeSpacing.md,
  lg: ThemeSpacing.lg,
  xl: ThemeSpacing.xl,
  xxl: 48, // not in theme scale; preserved for legacy callers
} as const;

export const Layout = {
  headerHeight: 60,
  bottomTabHeight: 56,
  borderRadius: {
    sm: Radius.DEFAULT,
    md: Radius.md,
    lg: Radius.lg,
    // Preserve the pre-shim value of 20 so unrefactored modals/sheets keep
    // their original corner radius. The theme's `radius.xl` is 24 by design;
    // a sweep-and-replace to migrate consumers should happen before this
    // legacy constant changes.
    xl: 20,
  },
} as const;
