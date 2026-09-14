import { useQuery } from '@tanstack/react-query';
import {
  subscriptionService,
  type SubscriptionPayment,
  type SubscriptionState,
} from '@/modules/subscription/services/subscriptionService';

/**
 * No tenant suffix on these keys, unlike admin-web's `useSubscription.ts`.
 * Mobile's tenant isolation is `queryClient.clear()` on every login
 * (`AuthContext.tsx`), not per-query keys — a school switch already empties
 * the cache these keys would otherwise need to be scoped against.
 */
export const subscriptionKeys = {
  state: ['subscription', 'state'] as const,
  payments: ['subscription', 'payments'] as const,
};

export function useSubscriptionState(enabled = true) {
  return useQuery<SubscriptionState>({
    queryKey: subscriptionKeys.state,
    queryFn: () => subscriptionService.state(),
    enabled,
    // Refreshed occasionally so a trial expiry / suspension is reflected
    // without the admin having to leave and reopen this screen.
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
}

/** Needs `subscription.read` — pass `enabled` once the state query confirms it. */
export function useSubscriptionPayments(enabled = true) {
  return useQuery<SubscriptionPayment[]>({
    queryKey: subscriptionKeys.payments,
    queryFn: async () => (await subscriptionService.payments()).payments,
    enabled,
    staleTime: 60_000,
  });
}
