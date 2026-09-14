/**
 * Subscription service.
 *
 * Wraps the same two endpoints admin-web's `subscriptionService.ts` does —
 * `GET /api/subscription/state` and `GET /api/subscription/payments` — so a
 * school's admin sees one answer to "where do we stand", whichever app asks.
 * Read-only from here; super-admin mutations live in the panel app.
 */

import { apiGet } from '@/common/services/api';
import { API_ENDPOINTS } from '@/common/constants/api';

export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'deleted' | null;

export type SubscriptionReason =
  | 'Active'
  | 'Trial'
  | 'TrialExpired'
  | 'PaymentDue'
  | 'GracePeriodExpired'
  | 'SubscriptionSuspended'
  | 'TenantDeleted'
  | 'SubscriptionUnknown'
  | 'TenantNotFound';

export type TermStanding = 'no_term' | 'current' | 'payment_due' | 'grace_expired';

export interface SubscriptionTerm {
  starts_on: string | null;
  due_on: string | null;
  grace_days: number;
  grace_ends_on: string | null;
  days_until_due: number | null;
  /** Days left in the grace period; negative once it has passed. */
  days_left_in_grace: number | null;
  /** How close to the due date the countdown (and the daily reminder) begins. */
  reminder_window_days: number;
  standing: TermStanding;
}

export interface SubscriptionState {
  subscription: {
    status: SubscriptionStatus;
    allow_writes: boolean;
    reason: SubscriptionReason;
    message: string;
    trial_ends_at: string | null;
    billing_cycle: string;
  };
  /** Behind `subscription.read` — omitted entirely for anyone without it. */
  term?: SubscriptionTerm;
}

/** One payment the school made, as Nexchool recorded it. Read-only here. */
export interface SubscriptionPayment {
  id: string;
  amount: number;
  currency: string;
  paid_on: string;
  method: 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'other';
  reference: string | null;
  covers_from: string | null;
  covers_to: string | null;
  note: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

export const subscriptionService = {
  state: () => apiGet<SubscriptionState>(API_ENDPOINTS.SUBSCRIPTION_STATE),
  payments: () =>
    apiGet<{ payments: SubscriptionPayment[] }>(API_ENDPOINTS.SUBSCRIPTION_PAYMENTS),
};
