import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Palette } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { ProgressRing } from './ProgressRing';

type IconName = keyof typeof Ionicons.glyphMap;

export type KpiTrendTone = 'up' | 'down' | 'flat';

export interface KpiTrend {
  label: string;
  tone: KpiTrendTone;
}

export interface DashboardKpiCardProps {
  label: string;
  value: string;
  /** Palette token for the 4px left accent bar. */
  accentColor: keyof Palette;
  iconName: IconName;
  /** Palette token for the icon chip background. */
  iconChipBg: keyof Palette;
  /** Palette token for the icon glyph color. */
  iconChipFg: keyof Palette;
  /** When set, renders a right-aligned progress ring (value 0-100). */
  progress?: number;
  /** Optional trend sub-line. */
  trend?: KpiTrend;
}

const TONE_ICON: Record<KpiTrendTone, IconName> = {
  up: 'trending-up',
  down: 'trending-down',
  flat: 'remove',
};

const TONE_COLOR: Record<KpiTrendTone, keyof Palette> = {
  up: 'success',
  down: 'error',
  flat: 'onSurfaceVariant',
};

export function DashboardKpiCard({
  label,
  value,
  accentColor,
  iconName,
  iconChipBg,
  iconChipFg,
  progress,
  trend,
}: DashboardKpiCardProps) {
  const { palette, spacing, radius, elevation } = useTheme();

  return (
    <View
      style={[
        styles.card,
        elevation.card,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: palette[accentColor],
        },
      ]}
    >
      <View style={[styles.topRow, { gap: spacing.sm }]}>
        <View
          style={[
            styles.iconChip,
            { backgroundColor: palette[iconChipBg], borderRadius: radius.lg, padding: spacing.sm },
          ]}
        >
          <AppIcon name={iconName} size="md" color={iconChipFg} />
        </View>
        <Text variant="overline" color="onSurfaceVariant" style={{ flex: 1 }} numberOfLines={2}>
          {label}
        </Text>
      </View>

      <View style={[styles.bottomRow, { marginTop: spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
            {value}
          </Text>
          {trend ? (
            <View style={[styles.trendRow, { marginTop: 4, gap: 4 }]}>
              <AppIcon name={TONE_ICON[trend.tone]} size="sm" color={TONE_COLOR[trend.tone]} />
              <Text variant="labelSm" color={TONE_COLOR[trend.tone]} numberOfLines={1}>
                {trend.label}
              </Text>
            </View>
          ) : null}
        </View>
        {progress != null ? (
          <ProgressRing value={progress} size={44} stroke={4} progressColor={accentColor} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconChip: { alignItems: 'center', justifyContent: 'center' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  trendRow: { flexDirection: 'row', alignItems: 'center' },
});
