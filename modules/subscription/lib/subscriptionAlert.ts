/**
 * How loudly the subscription screen should be talking right now.
 *
 * Ported from admin-web's `lib/subscriptionAlert.ts` unchanged in logic, so
 * the two apps never disagree about whether something is wrong. The standing
 * itself is decided on the server (`modules/subscription/term.py`); this only
 * turns it into a level of noise.
 */

import type { SubscriptionState } from '@/modules/subscription/services/subscriptionService';

export type AlertLevel =
  /** Nothing to say. */
  | 'none'
  /** Payment is coming up inside the notice window. */
  | 'due_soon'
  /** The due date has passed; the grace period is running. */
  | 'overdue'
  /** Nothing can be saved: grace ran out, the trial ended, or the account is closed. */
  | 'blocked';

/** Days before the due date at which the countdown starts, if the server hasn't said. */
const FALLBACK_NOTICE_WINDOW_DAYS = 7;

export function subscriptionAlertLevel(state: SubscriptionState | undefined): AlertLevel {
  if (!state) return 'none';
  const { subscription, term } = state;

  if (
    !subscription.allow_writes ||
    subscription.reason === 'GracePeriodExpired' ||
    subscription.reason === 'TrialExpired' ||
    subscription.reason === 'SubscriptionSuspended' ||
    subscription.reason === 'TenantDeleted'
  ) {
    return 'blocked';
  }
  if (subscription.reason === 'PaymentDue' || term?.standing === 'payment_due') {
    return 'overdue';
  }
  if (term?.standing === 'current' && term.days_until_due != null) {
    const window = term.reminder_window_days ?? FALLBACK_NOTICE_WINDOW_DAYS;
    if (term.days_until_due <= window) return 'due_soon';
  }
  // A trial with an end date in sight reads the same as a payment coming up.
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    const days = daysFromNow(subscription.trial_ends_at);
    if (days != null && days <= FALLBACK_NOTICE_WINDOW_DAYS) return 'due_soon';
  }
  return 'none';
}

/** Whole days from now until an ISO instant or date. Negative once it has passed. */
export function daysFromNow(iso: string): number | null {
  const then = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.ceil((then - Date.now()) / 86_400_000);
}
