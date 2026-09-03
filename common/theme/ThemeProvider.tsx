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
  /**
   * The school's own colours, as resolved by the server from the brand seeds a
   * super admin set. Merged over the built-in palette so a partial or
   * older-shaped payload can only change the colours it actually names, never
   * leave a token undefined.
   *
   * Colours only. Type scale, spacing, radii and layout come from separate
   * token modules and are the same in every school — a tenant brands the app,
   * it does not redesign it.
   */
  paletteOverride?: Partial<Palette> | null;
};

export function ThemeProvider({ children, mode = 'light', paletteOverride }: Props) {
  const value = useMemo<Theme>(() => {
    const base = mode === 'dark' ? darkPalette : lightPalette;
    return {
      mode,
      palette: paletteOverride ? { ...base, ...paletteOverride } : base,
    };
  }, [mode, paletteOverride]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
