import { useEffect, useState } from 'react';

import { apiGet } from '@/common/services/api';
import { hasKnownTenant } from '@/common/utils/storage';

/**
 * The ways in this school allows, from its authentication policy.
 *
 * Published on the branding endpoint the app already calls before sign-in —
 * the same source, asked a different question. It is what decides whether the
 * mobile-PIN option appears at all: a method a school has not enabled must not
 * be offered, and because the server refuses it anyway this hides an option
 * rather than enforcing a rule.
 *
 * Deliberately not folded into `useTenantTheme`. That hook is about colours:
 * it caches to storage so a cold start opens already branded, and refreshes on
 * every foreground. None of that is right for a policy answer read once on a
 * sign-in screen, and sharing the cache would mean a school's palette and its
 * sign-in options expiring together for no reason.
 *
 * Fails quiet. With no tenant known yet (`common/utils/storage.ts`
 * `hasKnownTenant` — no id, no subdomain either), no network, or an older
 * server that does not publish the field, the answer is "no extra methods" —
 * which leaves the screen exactly as it was before this existed.
 */
type AuthMethodsResponse = {
  auth?: { methods?: string[] };
};

export function usePublishedAuthMethods() {
  const [methods, setMethods] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const known = await hasKnownTenant();
      if (!known) return;
      try {
        const data = await apiGet<AuthMethodsResponse>('/api/auth/tenant-branding');
        if (active) setMethods(data?.auth?.methods ?? []);
      } catch {
        // Offline, or a school with no policy row. Offering nothing extra is
        // the safe failure.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return {
    methods,
    allows: (method: string) => methods.includes(method),
  };
}
