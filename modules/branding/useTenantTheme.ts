import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Palette } from '@/common/theme';
import { apiGet } from '@/common/services/api';
import {
  getCachedTenantTheme,
  setCachedTenantTheme,
  getTenantId,
} from '@/common/utils/storage';
import { registerThemeRefreshHandler } from './themeRefresh';

type BrandingResponse = {
  name?: string;
  theme?: { seeds?: Record<string, string>; colors?: Record<string, string> } | null;
};

/**
 * The school's colours, applied to the whole app.
 *
 * Read from cache first so a cold start opens already branded, then corrected
 * from the server in the background. The order matters: fetching first would
 * show every launch a flash of the default palette before the school's own.
 *
 * Refreshed when the app comes back to the foreground and whenever the signed
 * in tenant changes, which between them cover the two moments a theme can have
 * been changed in the panel since it was last read — the app was in a pocket,
 * or somebody else signed in. That is the ordinary bargain for branding: it
 * costs a relaunch or a return to the app, not a push notification.
 */
export function useTenantTheme(tenantId: string | null) {
  const [palette, setPalette] = useState<Partial<Palette> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void getCachedTenantTheme().then((cached) => {
      if (!active) return;
      if (cached) setPalette(cached as Partial<Palette>);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    // The endpoint resolves the school from the tenant header the API client
    // already sends. With no tenant there is nobody to be branded as, and the
    // sign-in screen stays in the app's own colours.
    const tenant = await getTenantId();
    if (!tenant) return;
    try {
      const data = await apiGet<BrandingResponse>('/api/auth/tenant-branding');
      const colors = data?.theme?.colors ?? null;
      setPalette((colors as Partial<Palette> | null) ?? null);
      await setCachedTenantTheme(colors);
    } catch {
      // Offline, or the school has no branding. Neither is worth surfacing:
      // whatever is cached — or the built-in palette — is still correct enough
      // to render the app.
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, tenantId, refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Signing in or out is the other moment the answer can change.
  useEffect(() => registerThemeRefreshHandler(() => void refresh()), [refresh]);

  return { palette, hydrated };
}
