import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { formatCurrency, formatCurrencyShort } from '@/common/utils/formatCurrency';
import type { FeeCollectionPoint } from '@/modules/dashboard/types';

const PLOT_HEIGHT = 150;
const MARGIN = { top: 10, right: 20, bottom: 26, left: 52 };
const SVG_HEIGHT = MARGIN.top + PLOT_HEIGHT + MARGIN.bottom;
const GRID_INTERVALS = 4;
const AXIS_FONT_SIZE = 11;
const DOT_RADIUS = 3.5;
const ZERO_DOT_RADIUS = 2.5;
const SELECTED_DOT_RADIUS = 5;
const TOOLTIP_HEIGHT = 42;
const TOOLTIP_GAP = 10;
/** Rough Inter glyph advance at 11–12px, used to size the tooltip box. */
const APPROX_CHAR_WIDTH = 6.8;

export interface FeeTrendChartProps {
  data: FeeCollectionPoint[];
  title: string;
  /** Period label rendered to the right of the title, e.g. "Last 7 days". */
  subtitle: string;
}

function shortDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

/**
 * Round a value up to the next 1 / 2 / 2.5 / 5 × 10ⁿ so the y-axis lands on
 * ticks people can read: a ₹93.2K peak scales to ₹1.0L with ₹25K gridlines,
 * not to ₹93.2K with ₹23.3K gridlines.
 */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const fraction = value / exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * exponent;
}

interface XY {
  x: number;
  y: number;
}

/**
 * Monotone cubic interpolation (Fritsch–Carlson), the same curve recharts
 * draws for `type="monotone"` on the web dashboard. Unlike a plain Catmull-Rom
 * spline it never overshoots, so a run of zero-collection days stays a flat
 * line instead of dipping below the axis.
 */
function monotonePath(pts: XY[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;

  const n = pts.length;
  const dx: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    slopes.push((pts[i + 1].y - pts[i].y) / (dx[i] || 1));
  }

  const tangents: number[] = [slopes[0]];
  for (let i = 1; i < n - 1; i++) {
    const a = slopes[i - 1];
    const b = slopes[i];
    tangents.push(a * b <= 0 ? 0 : (a + b) / 2);
  }
  tangents.push(slopes[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const alpha = tangents[i] / slopes[i];
    const beta = tangents[i + 1] / slopes[i];
    const size = alpha * alpha + beta * beta;
    if (size > 9) {
      const scale = 3 / Math.sqrt(size);
      tangents[i] = scale * alpha * slopes[i];
      tangents[i + 1] = scale * beta * slopes[i];
    }
  }

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const third = dx[i] / 3;
    const c1x = pts[i].x + third;
    const c1y = pts[i].y + tangents[i] * third;
    const c2x = pts[i + 1].x - third;
    const c2y = pts[i + 1].y - tangents[i + 1] * third;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

/**
 * Last-7-days fee collection, drawn to match the web dashboard's area chart:
 * a monotone curve over a fading fill, dashed gridlines with ₹ ticks, a dot
 * per day, and dates along the bottom.
 *
 * The web chart answers "how much" with a hover tooltip. A phone has no
 * hover, so tapping a day's column shows the same date-and-amount bubble
 * above its dot; tapping again dismisses it.
 */
export function FeeTrendChart({ data, title, subtitle }: FeeTrendChartProps) {
  const { t, i18n } = useTranslation('finance');
  const { palette, spacing, radius } = useTheme();
  const locale = i18n.language ?? 'en';
  const [selected, setSelected] = useState<number | null>(null);
  const [width, setWidth] = useState(0);

  const points = Array.isArray(data) ? data : [];
  const amounts = points.map((p) => Number(p.amount) || 0);
  const total = amounts.reduce((sum, a) => sum + a, 0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const header = (
    <View style={styles.header}>
      <View style={[styles.titleRow, { gap: spacing.sm }]}>
        <AppIcon name="trending-up-outline" size="md" color="primary" />
        <Text variant="headlineMd" color="onSurface" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>
      <Text variant="bodySm" color="onSurfaceVariant">
        {subtitle}
      </Text>
    </View>
  );

  if (points.length === 0 || total === 0) {
    return (
      <View>
        {header}
        <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: spacing.md }}>
          {t('dashboard.chartEmpty', { defaultValue: 'No fee collections in the last 7 days.' })}
        </Text>
      </View>
    );
  }

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const yMax = niceCeil(Math.max(...amounts));
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const toY = (amount: number) => MARGIN.top + PLOT_HEIGHT - (amount / yMax) * PLOT_HEIGHT;
  const xy: XY[] = amounts.map((amount, i) => ({ x: MARGIN.left + i * step, y: toY(amount) }));
  const baseline = MARGIN.top + PLOT_HEIGHT;

  const linePath = monotonePath(xy);
  const areaPath = xy.length > 0
    ? `${linePath} L${xy[xy.length - 1].x},${baseline} L${xy[0].x},${baseline} Z`
    : '';

  const ticks = Array.from({ length: GRID_INTERVALS + 1 }, (_, i) => (yMax * i) / GRID_INTERVALS);

  const active = selected != null ? xy[selected] : null;
  const activeDateLabel = selected != null ? shortDate(points[selected].date, locale) : '';
  const activeAmountLabel = selected != null ? formatCurrency(amounts[selected]) : '';
  const tooltipWidth =
    Math.max(activeDateLabel.length, activeAmountLabel.length) * APPROX_CHAR_WIDTH + spacing.md * 2;
  const tooltipX = active
    ? Math.min(Math.max(0, active.x - tooltipWidth / 2), Math.max(0, width - tooltipWidth))
    : 0;
  const tooltipAbove = active ? active.y - TOOLTIP_HEIGHT - TOOLTIP_GAP : 0;
  const tooltipY = active && tooltipAbove >= 0 ? tooltipAbove : (active?.y ?? 0) + TOOLTIP_GAP;

  return (
    <View>
      {header}
      <View onLayout={onLayout} style={{ marginTop: spacing.md, height: SVG_HEIGHT }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={SVG_HEIGHT}>
              <Defs>
                <LinearGradient id="feeTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="5%" stopColor={palette.primary} stopOpacity={0.2} />
                  <Stop offset="95%" stopColor={palette.primary} stopOpacity={0} />
                </LinearGradient>
              </Defs>

              {ticks.map((tick) => {
                const y = toY(tick);
                return (
                  <G key={tick}>
                    <Line
                      x1={MARGIN.left}
                      x2={MARGIN.left + plotWidth}
                      y1={y}
                      y2={y}
                      stroke={palette.outlineVariant}
                      strokeOpacity={0.6}
                      strokeDasharray="3 3"
                    />
                    <SvgText
                      x={MARGIN.left - spacing.sm}
                      y={y + AXIS_FONT_SIZE / 3}
                      fontSize={AXIS_FONT_SIZE}
                      fontFamily="Inter_400Regular"
                      fill={palette.onSurfaceVariant}
                      textAnchor="end"
                    >
                      {formatCurrencyShort(tick)}
                    </SvgText>
                  </G>
                );
              })}

              <Path d={areaPath} fill="url(#feeTrendFill)" />
              <Path
                d={linePath}
                fill="none"
                stroke={palette.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {xy.map((p, i) => {
                const isZero = amounts[i] === 0;
                const isSelected = selected === i;
                return (
                  <G key={points[i].date ?? i}>
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? SELECTED_DOT_RADIUS : isZero ? ZERO_DOT_RADIUS : DOT_RADIUS}
                      fill={isZero && !isSelected ? palette.outlineVariant : palette.primary}
                      stroke={palette.surfaceContainerLowest}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                    <SvgText
                      x={p.x}
                      y={baseline + MARGIN.bottom - AXIS_FONT_SIZE / 2}
                      fontSize={AXIS_FONT_SIZE}
                      fontFamily="Inter_400Regular"
                      fill={isSelected ? palette.primary : palette.onSurfaceVariant}
                      textAnchor="middle"
                    >
                      {shortDate(points[i].date, locale)}
                    </SvgText>
                  </G>
                );
              })}

              {active ? (
                <G>
                  <Rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={TOOLTIP_HEIGHT}
                    rx={radius.md}
                    fill={palette.surfaceContainerLowest}
                    stroke={palette.outlineVariant}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={tooltipX + spacing.md}
                    y={tooltipY + 17}
                    fontSize={12}
                    fontFamily="Inter_600SemiBold"
                    fill={palette.onSurface}
                  >
                    {activeDateLabel}
                  </SvgText>
                  <SvgText
                    x={tooltipX + spacing.md}
                    y={tooltipY + 33}
                    fontSize={12}
                    fontFamily="Inter_400Regular"
                    fill={palette.onSurfaceVariant}
                  >
                    {activeAmountLabel}
                  </SvgText>
                </G>
              ) : null}
            </Svg>

            {/* Tap targets: one full-height column per day, laid over the plot. */}
            <View
              style={[
                styles.touchLayer,
                {
                  left: MARGIN.left - step / 2,
                  width: plotWidth + step,
                  top: MARGIN.top,
                  height: PLOT_HEIGHT + MARGIN.bottom,
                },
              ]}
            >
              {points.map((point, i) => (
                <Pressable
                  key={point.date ?? i}
                  style={styles.touchColumn}
                  onPress={() => setSelected(selected === i ? null : i)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected === i }}
                  accessibilityLabel={`${shortDate(point.date, locale)}: ${formatCurrency(amounts[i])}`}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  title: { flexShrink: 1 },
  touchLayer: { position: 'absolute', flexDirection: 'row' },
  touchColumn: { flex: 1 },
});
