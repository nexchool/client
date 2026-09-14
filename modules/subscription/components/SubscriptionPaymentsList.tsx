import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { formatCurrency } from '@/common/utils/formatCurrency';
import type { SubscriptionPayment } from '@/modules/subscription/services/subscriptionService';

const METHOD_LABEL: Record<SubscriptionPayment['method'], string> = {
  bank_transfer: 'Bank transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  cash: 'Cash',
  other: 'Other',
};

function fmtDay(iso: string | null): string {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * What the school has paid Nexchool, as Nexchool recorded it — mirrors
 * admin-web's `PaymentsCard` content (same fields, read-only for the same
 * reason: these are written from the super-admin panel, and the school sees
 * the same list so a query about a payment starts from one shared record).
 * A voided payment stays here, struck through, with the reason.
 */
export function SubscriptionPaymentsList({
  payments,
  emptyLabel,
  voidedLabel,
}: {
  payments: SubscriptionPayment[];
  emptyLabel: string;
  voidedLabel: (reason: string) => string;
}) {
  const { palette, spacing, radius, elevation } = useTheme();

  if (payments.length === 0) {
    return (
      <Text variant="bodyMd" color="onSurfaceVariant">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {payments.map((payment) => {
        const struck = Boolean(payment.voided_at);
        const textColor = struck ? 'onSurfaceVariant' : 'onSurface';
        return (
          <View
            key={payment.id}
            style={[
              {
                backgroundColor: palette.surfaceContainerLowest,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing[4],
              },
              elevation.card,
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text
                variant="bodyMd"
                color={textColor}
                style={struck ? { textDecorationLine: 'line-through' } : undefined}
              >
                {fmtDay(payment.paid_on)}
              </Text>
              <Text
                variant="bodyLg"
                color={textColor}
                style={struck ? { textDecorationLine: 'line-through' } : undefined}
              >
                {formatCurrency(payment.amount)}
              </Text>
            </View>
            <Text variant="labelSm" color="onSurfaceVariant">
              {METHOD_LABEL[payment.method] ?? payment.method}
              {payment.reference ? ` · ${payment.reference}` : ''}
            </Text>
            {payment.voided_at ? (
              <Text variant="labelSm" color="error">
                {voidedLabel(payment.void_reason ?? '')}
              </Text>
            ) : payment.note ? (
              <Text variant="labelSm" color="onSurfaceVariant">
                {payment.note}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
