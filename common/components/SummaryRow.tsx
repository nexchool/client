import React from 'react';
import { View } from 'react-native';
import { type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';

/**
 * A label on the left, its value on the right — the line a total, a subtotal
 * or a due date is written on.
 *
 * Distinct from `DetailRow`, which it is easy to mistake for: that one is an
 * icon in a 40pt circle with the label stacked over the value, for profile and
 * "personal details" blocks. This is a ledger line. They read differently
 * because they are different things, and collapsing them would put an icon
 * next to every subtotal.
 *
 * It existed twice before it existed once — as `SummaryRow` on the invoice
 * detail and as a local `DetailRow` on the student-fee detail, the second
 * being the first without `emphasis`.
 */
export function SummaryRow({
  label,
  value,
  valueColor,
  emphasis = false,
}: {
  label: string;
  value: string;
  valueColor?: keyof Palette;
  /** The grand total, as against the lines that add up to it. */
  emphasis?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text variant="labelMd" color="onSurfaceVariant">
        {label}
      </Text>
      <Text
        variant={emphasis ? 'headlineMd' : 'labelMd'}
        color={valueColor ?? 'onSurface'}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
