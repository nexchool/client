import { useEffect, useState } from 'react';

import { apiGet } from '@/common/services/api';
import { hasKnownTenant } from '@/common/utils/storage';

/**
 * The ways in this school allows, from its authentication policy — plus the
 * display identity (name, logo, tagline) that rides along on the same
 * response, so the sign-in screen needs one call, not two, for the two
 * questions it asks before anyone has signed in.
 *
 * Published on the branding endpoint the app already calls before sign-in —
 * the same source, asked a different question. `methods` is what decides
 * whether the mobile-PIN and mobile-code options appear at all: a method a
 * school has not enabled must not be offered, and because the server refuses
 * it anyway this hides an option rather than enforcing a rule.
 *
 * Deliberately not folded into `useTenantTheme`. That hook is about colours:
 * it caches to storage so a cold start opens already branded, and refreshes on
 * every foreground. None of that is right for a policy answer read once on a
 * sign-in screen, and sharing the cache would mean a school's palette and its
 * sign-in options expiring together for no reason.
 *
 * Fails quiet. With no tenant known yet (`common/utils/storage.ts`
 * `hasKnownTenant` — no id, no subdomain either), no network, or an older
 * server that does not publish the field, `methods` is empty and `branding`
 * stays `null` — which leaves the screen exactly as it was before this
 * existed: a generic sign-in form with no extra methods offered. `loaded`
 * tells the two failure shapes ("still asking") and ("asked and got
 * nothing") apart, which matters for `methods`: a caller must not read an
 * empty list as "this school offers nothing" before the request has even
 * settled — see the login screen's `emailOffered`.
 */
type AuthMethodsResponse = {
  name?: string;
  logo_url?: string | null;
  tagline?: string | null;
  auth?: { methods?: string[] };
};

export type PublishedBranding = {
  name: string | null;
  logoUrl: string | null;
  tagline: string | null;
};

export function usePublishedAuthMethods() {
  const [methods, setMethods] = useState<string[]>([]);
  const [branding, setBranding] = useState<PublishedBranding | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      const known = await hasKnownTenant();
      if (!known) {
        if (active) setLoaded(true);
        return;
      }
      try {
        const data = await apiGet<AuthMethodsResponse>('/api/auth/tenant-branding');
        if (!active) return;
        setMethods(data?.auth?.methods ?? []);
        setBranding({
          name: data?.name?.trim() || null,
          logoUrl: data?.logo_url?.trim() || null,
          tagline: data?.tagline?.trim() || null,
        });
      } catch {
        // Offline, or a school with no policy row. Offering nothing extra —
        // and showing no borrowed identity — is the safe failure.
      } finally {
        if (active) setLoaded(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    methods,
    branding,
    loaded,
    allows: (method: string) => methods.includes(method),
  };
}
