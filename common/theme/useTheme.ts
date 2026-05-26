import { useContext } from 'react';
import { ThemeContext, type Theme } from './ThemeProvider';
import { Spacing, Radius } from './tokens';
import { Typography } from './typography';
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
  };
}
