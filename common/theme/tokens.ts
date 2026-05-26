/**
 * Raw design tokens for the nexchool design system.
 * Source of truth for spacing/radius/breakpoint/elevation primitives.
 * Color tokens live in palettes.ts; typography lives in typography.ts.
 *
 * Mapping reference: Stitch design.md ("Academic Fluidity") — see
 * docs/superpowers/specs/2026-05-27-nexchool-ui-refactor-slice1-design.md.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  marginMobile: 20,
  gutter: 16,
} as const;

export const Radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type SpacingKey = keyof typeof Spacing;
export type RadiusKey = keyof typeof Radius;
