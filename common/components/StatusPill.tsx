import React from 'react';
import { View } from 'react-native';
import { useTheme, withAlpha, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';

/**
 * One status, wearing its colour.
 *
 * This existed five times over before it existed once: in the student-fee
 * list, the invoice list, the invoice detail and the student-fee detail, each
 * re-deriving the same quiet fill by concatenating an alpha suffix onto a
 * palette hex — `` `${color}15` `` in three of them and `` `${color}1A` `` in
 * the fourth, which is the same intent written at two different opacities
 * because nobody could see the other copies. `withAlpha` had been sitting in
 * `common/theme` the whole time, and unlike the concatenation it survives a
 * palette token that is not a six-digit hex.
 *
 * It deliberately knows no status vocabulary. Fee status, invoice status and
 * payment status are three different lists that happen to share an
 * appearance, so the caller maps its own status to a `tone` and keeps its
 * meaning; this owns only what the pill looks like.
 */
export function StatusPill({
  label,
  tone,
}: {
  label: string;
  /** Palette token the pill borrows for its border, text and washed fill. */
  tone: keyof Palette;
}) {
  const { palette, spacing, radius } = useTheme();
  const color = palette[tone];
  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: withAlpha(color, 0.08),
      }}
    >
      <Text variant="labelSm" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
