/**
 * Raw design tokens for the nexchool design system.
 * Source of truth for spacing/radius/breakpoint/elevation primitives.
 * Color tokens live in palettes.ts; typography lives in typography.ts.
 *
 * Mapping reference: Stitch design.md ("Academic Fluidity") — see
 * docs/superpowers/specs/2026-05-27-nexchool-ui-refactor-slice1-design.md.
 */

const space = { 2: 2, 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 40: 40, 48: 48 } as const;
export const Spacing = {
  ...space,
  xs: space[4],
  sm: space[8],
  md: space[16],
  lg: space[24],
  xl: space[32],
  marginMobile: space[20],
  gutter: space[16],
  /**
   * Bottom inset for scrollable list content — one value so the last row clears
   * the bottom tab bar and breathes, replacing the per-screen xl*2 / xl*3 mix.
   * For plain scroll/list screens.
   */
  scrollBottom: 96,
  /**
   * Bottom inset for screens with an action bar pinned over the content — a
   * Save button, a Mark-all row. The last item has to clear the tab bar *and*
   * that bar.
   *
   * "Footer-overlap screens keep their own larger clearance" was the rule and
   * it had no token, so each screen picked its own: 100 here, 120 there, 200 in
   * the composer. That is the same measurement written three ways, and the odd
   * ones out are simply where somebody guessed.
   */
  scrollBottomWithFooter: 120,
} as const;

/**
 * Where the device stops being a phone.
 *
 * The file header has claimed to be the source of truth for breakpoints since
 * it was written, and there were none — which is why nothing in the app ever
 * asked how wide the screen was, and every screen rendered a phone layout
 * stretched across an iPad.
 *
 * 600 is Android's own tablet threshold and roughly where a phone in landscape
 * lands. 840 is a tablet held upright. 1200 is one held sideways.
 */
export const Breakpoint = { sm: 600, md: 840, lg: 1200 } as const;

/**
 * How wide a column of content is allowed to get.
 *
 * A phone layout does not become a tablet layout by being stretched. At 1024pt
 * an email field is a thousand points long, its label is at one end and its
 * "Show" button at the other, and a line of body text runs past any comfortable
 * reading measure. Capping the column and centring it is what makes the same
 * screens legible on both.
 *
 * 720 is the compromise: wide enough that a list row or a timetable still has
 * room, narrow enough that a form reads as a form. Below this — every phone —
 * nothing changes at all, because the cap never binds.
 */
export const ContentMaxWidth = 720;

export const Radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const IconSize = { sm: 16, md: 20, lg: 24, xl: 32, hero: 48 } as const;
export const AvatarSize = { sm: 32, md: 40, lg: 48 } as const;
export const LogoSize = { header: 28 } as const;
export const TouchTarget = { min: 44 } as const;

export type SpacingKey = keyof typeof Spacing;
export type RadiusKey = keyof typeof Radius;
export type IconSizeKey = keyof typeof IconSize;
export type AvatarSizeKey = keyof typeof AvatarSize;
