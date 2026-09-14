import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useSubscriptionState } from './useSubscription';

/**
 * Whether the signed-in admin's school is suspended right now.
 *
 * The one flag the chrome (`AppHeader`'s icons, `BottomTabBar`, the
 * subscription screen's own back button) and the protected layout's
 * redirect all key off, so they can never disagree about how locked-down
 * the app is. Always `false` for a non-admin — mobile signs a non-admin out
 * the moment a suspended tenant is discovered (see
 * `common/services/tenantSuspended.ts`), so there is no "locked chrome" state
 * for them to see.
 */
export function useSubscriptionLock(): boolean {
  const { isAuthenticated, isLoading, mustResetPassword } = useAuth();
  const { isAdmin } = useUiRole();
  const { data } = useSubscriptionState(
    isAuthenticated && !isLoading && !mustResetPassword && isAdmin,
  );
  return isAdmin && data?.subscription.status === 'suspended';
}
