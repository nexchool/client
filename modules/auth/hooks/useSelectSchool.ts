import { useState } from 'react';
import { router } from 'expo-router';

import i18n from '@/i18n/i18nextInstance';
import { ApiException, apiGet } from '@/common/services/api';
import { deleteTenantSubdomain, setTenantSubdomain } from '@/common/utils/storage';

/**
 * The fallback school-identification step for a build with no tenant baked
 * in (the general Nexchool app — see `config/appConfig.ts#getBakedTenant`).
 *
 * A subdomain is the only thing a person can be expected to know about their
 * own school without digging through settings, and the server already
 * resolves one from `X-Tenant-Subdomain` for auth routes (`core/tenant.py`).
 * So this stores the typed value, then confirms it by asking for the one
 * endpoint that exists purely to answer "is there a school here" —
 * `tenant-branding` — rather than trusting whatever was typed and finding out
 * only when sign-in itself fails.
 *
 * Deliberately not a `LoginFieldError`-shaped hook like `useLogin`: there is
 * exactly one field, so one error string under it is all "which field" could
 * ever mean here.
 */
export function useSelectSchool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectSchool = async (input: string) => {
    setError(null);
    const subdomain = input.trim().toLowerCase();
    if (!subdomain) {
      setError(i18n.t('auth:validation.schoolRequired'));
      return;
    }

    setLoading(true);
    try {
      // Stored before the check, not after: `apiGet` reads the tenant to call
      // with from storage (common/services/api.ts) — there is no way to ask
      // "does this subdomain resolve" without it being the one in play.
      await setTenantSubdomain(subdomain);
      await apiGet('/api/auth/tenant-branding');
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      // Reverts what was just stored — a subdomain that turned out wrong
      // must not linger and get sent on the next request as if it were good.
      await deleteTenantSubdomain();
      const offline = err instanceof ApiException && err.status === 0;
      setError(i18n.t(offline ? 'auth:errors.network' : 'auth:errors.schoolNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return { selectSchool, loading, error };
}
