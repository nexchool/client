import { getBakedTenant } from '@/config/appConfig';
import { getTenantId, setTenantId, setTenantSubdomain } from '@/common/utils/storage';

/**
 * Write a build's baked-in tenant to storage before anything reads it.
 *
 * A school-specific build knows its tenant at compile time (see
 * `app.config.ts` / `EXPO_PUBLIC_TENANT_ID`), but every runtime read of "the
 * current tenant" — `usePublishedAuthMethods`, `useTenantTheme`, the API
 * client's `X-Tenant-ID` header — goes through SecureStore, not through the
 * build config directly. So the very first thing a baked build must do is
 * copy its compiled-in tenant into the same storage a normal login would
 * have filled in, before those reads happen. `app/_layout.tsx` awaits this
 * and gates the rest of the tree on it for exactly that reason.
 *
 * The one case this refuses to touch: a tenant is already stored *and*
 * differs from the baked one, while a session exists for it. That combination
 * only arises if this exact build's tenant id changes after people are
 * already signed in against the old one (a re-provisioned or corrected
 * config, redeployed as an update rather than a fresh install) — reinstalling
 * wipes SecureStore, so a fresh install of a correctly-baked build never hits
 * this branch. When it does, the stored tenant is the one the access and
 * refresh tokens were actually issued against; overwriting it would send
 * every subsequent request (branding, profile, everything gated by
 * `X-Tenant-ID`) to a school those tokens don't belong to, and the person
 * currently signed in would not have done anything to cause it or see it
 * happen. A silent identity switch under a live session is worse than
 * leaving a misconfigured build alone until its session ends — so this
 * function is a no-op whenever a tenant is already on record, baked build or
 * not, and a corrected tenant id ships by asking people to sign out (or by a
 * new install), never by overwriting a phone out from under them.
 */
export async function seedBakedTenant(): Promise<void> {
  const baked = getBakedTenant();
  if (!baked) return; // The general Nexchool app — nothing to seed here.

  const storedTenantId = await getTenantId();
  if (storedTenantId) return;

  await setTenantId(baked.id);
  if (baked.subdomain) {
    await setTenantSubdomain(baked.subdomain);
  }
}
