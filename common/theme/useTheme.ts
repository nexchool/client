import { useContext } from 'react';
import { ThemeContext, type Theme } from './ThemeProvider';
import { Spacing, Radius, IconSize, AvatarSize, LogoSize, TouchTarget } from './tokens';
import { Typography } from './typography';
import { Duration, Easings, Interaction } from './motion';
import { cardShadow, modalShadow, floatingShadow, focusRing } from './elevation';
import { shade } from './colorMix';

export type UseThemeResult = Theme & {
  spacing: typeof Spacing;
  radius: typeof Radius;
  typography: typeof Typography;
  elevation: {
    card: ReturnType<typeof cardShadow>;
    modal: ReturnType<typeof modalShadow>;
    /** The sign-in card's floating shadow — see `elevation.ts` for why this
     * is separate from `card`. */
    floating: ReturnType<typeof floatingShadow>;
    focusRing: (primaryHex: string) => ReturnType<typeof focusRing>;
  };
  iconSize: typeof IconSize;
  avatarSize: typeof AvatarSize;
  logoSize: typeof LogoSize;
  touchTarget: typeof TouchTarget;
  motion: { duration: typeof Duration; easing: typeof Easings; interaction: typeof Interaction };
};

export function useTheme(): UseThemeResult {
  const theme = useContext(ThemeContext);
  return {
    ...theme,
    spacing: Spacing,
    radius: Radius,
    typography: Typography,
    elevation: {
      card: cardShadow(theme.palette.onSurface),
      modal: modalShadow(theme.palette.onSurface),
      // A dark tint of this tenant's own primary, not `onSurface` — the
      // sign-in card is the one place the shadow is meant to glow in-hue
      // with the brand band above it rather than read as a neutral drop
      // shadow.
      floating: floatingShadow(shade(theme.palette.primary, 0.7)),
      focusRing,
    },
    iconSize: IconSize,
    avatarSize: AvatarSize,
    logoSize: LogoSize,
    touchTarget: TouchTarget,
    motion: { duration: Duration, easing: Easings, interaction: Interaction },
  };
}
