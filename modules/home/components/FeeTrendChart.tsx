import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { formatCurrency, formatCurrencyShort } from '@/common/utils/formatCurrency';
import type { FeeCollectionPoint } from '@/modules/dashboard/types';

const CHART_HEIGHT = 140;
const MIN_BAR_HEIGHT = 4;

export interface FeeTrendChartProps {
  data: FeeCollectionPoint[];
}

function shortDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

function weekday(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { weekday: 'short' });
  } catch {
    return '';
  }
}

/**
 * Last-7-days fee collection. No chart library — seven bars do not earn one.
 *
 * **It used to draw the shape and withhold the numbers.** Bars, weekday
 * labels, nothing else: an admin could see that Tuesday was taller than
 * Monday and had no way to learn what either collected. admin-web's version
 * of this same series carries a currency y-axis and a hover tooltip, so the
 * web dashboard answered "how much" and the phone did not.
 *
 * The two things that answer it here:
 *
 * A **scale label** at the top of the plot — the tallest bar's value, in the
 * same ₹Cr/L/K shorthand admin-web puts on its y-axis. That alone turns every
 * bar from a proportion into an amount you can estimate.
 *
 * And **tapping a bar** reads it out in full above the chart, which is the
 * touch equivalent of the tooltip; there is no hover to borrow on a phone.
 * The readout defaults to the period total, so the screen answers "how much
 * this week" before anyone touches it — the one number most likely to be
 * wanted, shown without an interaction.
 */
export function FeeTrendChart({ data }: FeeTrendChartProps) {
  const { t, i18n } = useTranslation('finance');
  const { palette, spacing, radius } = useTheme();
  const locale = i18n.language ?? 'en';
  const [selected, setSelected] = useState<number | null>(null);

  const points = Array.isArray(data) ? data : [];
  const maxAmount = points.reduce((max, p) => Math.max(max, Number(p.amount) || 0), 0);
  const total = points.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  if (points.length === 0 || total === 0) {
    return (
      <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: spacing.md }}>
        {t('dashboard.chartEmpty', { defaultValue: 'No fee collections in the last 7 days.' })}
      </Text>
    );
  }

  const active = selected != null ? points[selected] : null;

  return (
    <View>
      {/* The readout: the selected day, or the period total when nothing is. */}
      <View style={{ marginTop: spacing.md }}>
        <Text variant="overline" color="onSurfaceVariant">
          {active
            ? shortDate(active.date, locale)
            : t('dashboard.chartTotalLabel', { defaultValue: 'Collected this week' })}
        </Text>
        <Text variant="headlineMd" color="onSurface" numberOfLines={1}>
          {formatCurrency(active ? Number(active.amount) || 0 : total)}
        </Text>
      </View>

      <View style={{ marginTop: spacing.md }}>
        {/* The scale, so a bar's height is readable as an amount. */}
        <Text variant="labelSm" color="onSurfaceVariant">
          {formatCurrencyShort(maxAmount)}
        </Text>

        <View style={[styles.row, { height: CHART_HEIGHT, gap: spacing.sm }]}>
          {points.map((point, idx) => {
            const amount = Number(point.amount) || 0;
            const ratio = maxAmount > 0 ? amount / maxAmount : 0;
            const barHeight = Math.max(MIN_BAR_HEIGHT, ratio * CHART_HEIGHT);
            const isToday = idx === points.length - 1;
            const isSelected = selected === idx;
            const emphasised = isSelected || (selected == null && isToday);

            return (
              <Pressable
                key={point.date ?? idx}
                style={styles.column}
                onPress={() => setSelected(isSelected ? null : idx)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${shortDate(point.date, locale)}: ${formatCurrency(amount)}`}
              >
                <View
                  style={{
                    width: '70%',
                    height: barHeight,
                    backgroundColor: emphasised ? palette.primary : palette.primaryContainer,
                    borderTopLeftRadius: radius.sm,
                    borderTopRightRadius: radius.sm,
                  }}
                />
                <Text
                  variant="overline"
                  color={emphasised ? 'primary' : 'onSurfaceVariant'}
                  style={{ marginTop: spacing.xs }}
                  numberOfLines={1}
                >
                  {weekday(point.date, locale)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
});
