import { useContext } from 'react';
import { ThemeContext, type Theme } from './ThemeProvider';
import { Spacing, Radius, IconSize, AvatarSize, LogoSize, TouchTarget } from './tokens';
import { Typography } from './typography';
import { Duration, Easings, Interaction } from './motion';
import { cardShadow, modalShadow, focusRing } from './elevation';

export type UseThemeResult = Theme & {
  spacing: typeof Spacing;
  radius: typeof Radius;
  typography: typeof Typography;
  elevation: {
    card: ReturnType<typeof cardShadow>;
    modal: ReturnType<typeof modalShadow>;
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
      focusRing,
    },
    iconSize: IconSize,
    avatarSize: AvatarSize,
    logoSize: LogoSize,
    touchTarget: TouchTarget,
    motion: { duration: Duration, easing: Easings, interaction: Interaction },
  };
}
