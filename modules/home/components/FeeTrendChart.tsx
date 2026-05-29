import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import type { FeeCollectionPoint } from '@/modules/dashboard/types';

const CHART_HEIGHT = 140;
const MIN_BAR_HEIGHT = 4;

export interface FeeTrendChartProps {
  data: FeeCollectionPoint[];
}

/** Lightweight bar chart for the last-7-days fee collection. No chart library. */
export function FeeTrendChart({ data }: FeeTrendChartProps) {
  const { palette, spacing, radius } = useTheme();

  const points = Array.isArray(data) ? data : [];
  const maxAmount = points.reduce((max, p) => Math.max(max, Number(p.amount) || 0), 0);

  if (points.length === 0) {
    return (
      <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: spacing.md }}>
        No collection data
      </Text>
    );
  }

  return (
    <View style={[styles.row, { height: CHART_HEIGHT, marginTop: spacing.lg, gap: spacing.sm }]}>
      {points.map((point, idx) => {
        const amount = Number(point.amount) || 0;
        const ratio = maxAmount > 0 ? amount / maxAmount : 0;
        const barHeight = Math.max(MIN_BAR_HEIGHT, ratio * CHART_HEIGHT);
        const isToday = idx === points.length - 1;
        const weekday = (() => {
          try {
            return new Date(point.date).toLocaleDateString('en', { weekday: 'short' });
          } catch {
            return '';
          }
        })();

        return (
          <View key={point.date ?? idx} style={styles.column}>
            <View
              style={{
                width: '70%',
                height: barHeight,
                backgroundColor: isToday ? palette.primary : palette.primaryContainer,
                borderTopLeftRadius: radius.sm,
                borderTopRightRadius: radius.sm,
              }}
            />
            <Text
              variant="overline"
              color={isToday ? 'primary' : 'onSurfaceVariant'}
              style={{ marginTop: spacing.xs }}
              numberOfLines={1}
            >
              {weekday}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
});
