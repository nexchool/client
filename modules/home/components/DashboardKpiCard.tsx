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

/**
 * How the card arranges itself.
 *
 * `stack` is the original and stays the default: icon and label on one row,
 * the value beneath. It is built for a two-up grid, where each card is roughly
 * half the screen.
 *
 * `row` puts the icon chip on the left and the label over the value in a
 * flexed middle column, for a card that spans the full width. The finance
 * dashboard needs it because a school's collected total is a real number —
 * `₹1,45,77,190` at `headlineLg` wants about 250pt and a half-width card
 * offers 150, so the amount that matters most on the screen was the one
 * rendering as `₹1,45,77,19…`. Full width also buys the height back: `row` is
 * about 76pt against `stack`'s 120, so three stacked cards cost roughly what
 * the old two-plus-orphan grid did.
 */
export type KpiCardLayout = 'stack' | 'row';

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
  /** Default 'stack' — every pre-existing call site keeps the layout it had. */
  layout?: KpiCardLayout;
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
  layout = 'stack',
}: DashboardKpiCardProps) {
  const { palette, spacing, radius, elevation } = useTheme();

  const chip = (
    <View
      style={[
        styles.iconChip,
        { backgroundColor: palette[iconChipBg], borderRadius: radius.lg, padding: spacing.sm },
      ]}
    >
      <AppIcon name={iconName} size="md" color={iconChipFg} />
    </View>
  );

  const trendRow = trend ? (
    <View style={[styles.trendRow, { marginTop: spacing.xs, gap: spacing.xs }]}>
      <AppIcon name={TONE_ICON[trend.tone]} size="sm" color={TONE_COLOR[trend.tone]} />
      <Text variant="labelSm" color={TONE_COLOR[trend.tone]} numberOfLines={1}>
        {trend.label}
      </Text>
    </View>
  ) : null;

  const ring =
    progress != null ? (
      <ProgressRing value={progress} size={44} stroke={4} progressColor={accentColor} />
    ) : null;

  const shell = [
    styles.card,
    elevation.card,
    {
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: palette[accentColor],
    },
  ];

  if (layout === 'row') {
    return (
      <View style={[shell, styles.rowCard, { gap: spacing.md }]}>
        {chip}
        {/*
          `minWidth: 0` is what actually lets the value shrink instead of
          pushing the ring off the card: a flex child's default minimum is its
          content, so a long amount would otherwise refuse to ellipsize and
          overflow to the right rather than wrap into `numberOfLines`.
        */}
        <View style={styles.rowBody}>
          <Text variant="overline" color="onSurfaceVariant" numberOfLines={1}>
            {label}
          </Text>
          <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
            {value}
          </Text>
          {trendRow}
        </View>
        {ring}
      </View>
    );
  }

  return (
    <View style={shell}>
      <View style={[styles.topRow, { gap: spacing.sm }]}>
        {chip}
        <Text variant="overline" color="onSurfaceVariant" style={{ flex: 1 }} numberOfLines={2}>
          {label}
        </Text>
      </View>

      <View style={[styles.bottomRow, { marginTop: spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineLg" color="onSurface" numberOfLines={1}>
            {value}
          </Text>
          {trendRow}
        </View>
        {ring}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, justifyContent: 'space-between' },
  /*
    `flex: 0` undoes the `flex: 1` above, which exists so two `stack` cards
    sitting side by side in a row match heights. A full-width card is a child
    of a *column*, where the same `flex: 1` would stretch it to eat the
    scroll view instead.
  */
  rowCard: { flex: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  rowBody: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconChip: { alignItems: 'center', justifyContent: 'center' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  trendRow: { flexDirection: 'row', alignItems: 'center' },
});
