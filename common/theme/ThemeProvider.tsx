import React, { createContext, useMemo, type ReactNode } from 'react';
import { lightPalette, darkPalette, type Palette } from './palettes';

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  palette: Palette;
};

export const ThemeContext = createContext<Theme>({
  mode: 'light',
  palette: lightPalette,
});

type Props = {
  children: ReactNode;
  /**
   * Force a specific theme mode. Slice 1 always uses 'light'.
   * A later slice will wire system-appearance and a user toggle.
   */
  mode?: ThemeMode;
};

export function ThemeProvider({ children, mode = 'light' }: Props) {
  const value = useMemo<Theme>(
    () => ({
      mode,
      palette: mode === 'dark' ? darkPalette : lightPalette,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
