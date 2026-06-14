import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';

/** A day cell value: a real date or a leading/trailing blank in the grid. */
type Cell = { date: Date; iso: string } | null;

export type MonthGridProps = {
  /** Month being displayed (any date within it). */
  month: Date;
  onMonthChange: (next: Date) => void;
  /** Single-select: the selected ISO date. Range: from/to ISO dates. */
  selected?: string | null;
  rangeFrom?: string | null;
  rangeTo?: string | null;
  onSelectDay: (iso: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Changing this resets the internal view back to the day grid (e.g. when the
   *  sheet re-opens — the Modal keeps this component mounted). */
  resetKey?: unknown;
};

const CELL = 44; // TouchTarget.min — audit lens 1/6
const WEEKDAY_FMT = new Intl.DateTimeFormat('en-IN', { weekday: 'narrow' });
const MONTH_TITLE_FMT = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const MONTH_SHORT_FMT = new Intl.DateTimeFormat('en-IN', { month: 'short' });

function toIso(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildWeeks(month: Date): Cell[][] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: Cell[] = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, m, day);
    cells.push({ date, iso: toIso(date) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Sunday-first weekday letters derived from a known Sunday. */
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  WEEKDAY_FMT.format(new Date(2026, 5, 7 + i))
);

export function MonthGrid({
  month,
  onMonthChange,
  selected,
  rangeFrom,
  rangeTo,
  onSelectDay,
  minimumDate,
  maximumDate,
  resetKey,
}: MonthGridProps) {
  const { palette, spacing, radius } = useTheme();
  // 'days' -> the grid; 'months'/'years' -> quick-jump pickers from the title.
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');

  // The picker sheet keeps this mounted across open/close, so a stale year/month
  // quick-jump view would persist into the next open — reset on each open.
  useEffect(() => {
    setView('days');
  }, [resetKey]);

  const weeks = useMemo(() => buildWeeks(month), [month]);
  const todayIso = toIso(new Date());
  const min = minimumDate ? startOfDay(minimumDate) : null;
  const max = maximumDate ? startOfDay(maximumDate) : null;

  const shiftMonth = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  const isDisabled = (d: Date) => (min && d < min) || (max && d > max) || false;

  const yearBase = month.getFullYear();
  const years = useMemo(() => {
    const lo = min ? min.getFullYear() : yearBase - 60;
    const hi = max ? max.getFullYear() : yearBase + 5;
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [min, max, yearBase]);

  return (
    <View>
      {/* Header: prev / Month YYYY (tap -> years) / next */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => shiftMonth(-1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          style={{ width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="chevron-back" size="md" color="onSurface" />
        </Pressable>
        <Pressable
          onPress={() => setView(view === 'days' ? 'years' : 'days')}
          hitSlop={8}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
        >
          <Text variant="titleSm" color="onSurface">
            {MONTH_TITLE_FMT.format(month)}
          </Text>
          <AppIcon name={view === 'days' ? 'caret-down' : 'caret-up'} size="sm" color="onSurfaceVariant" />
        </Pressable>
        <Pressable
          onPress={() => shiftMonth(1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          style={{ width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppIcon name="chevron-forward" size="md" color="onSurface" />
        </Pressable>
      </View>

      {view === 'years' ? (
        <ScrollView
          style={{ maxHeight: CELL * 5 }}
          contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
          // Open near the active year so DOB/recent years aren't a long scroll away.
          contentOffset={{
            x: 0,
            y: Math.max(0, (Math.floor(years.indexOf(month.getFullYear()) / 4) - 2) * CELL),
          }}
        >
          {years.map((y) => {
            const active = y === month.getFullYear();
            return (
              <Pressable
                key={y}
                onPress={() => {
                  onMonthChange(new Date(y, month.getMonth(), 1));
                  setView('months');
                }}
                style={{
                  width: '25%',
                  height: CELL,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                    backgroundColor: active ? palette.primary : 'transparent',
                  }}
                >
                  <Text variant="labelLg" color={active ? 'onPrimary' : 'onSurface'}>
                    {y}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : view === 'months' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Array.from({ length: 12 }, (_, i) => i).map((mIdx) => {
            const active = mIdx === month.getMonth();
            return (
              <Pressable
                key={mIdx}
                onPress={() => {
                  onMonthChange(new Date(month.getFullYear(), mIdx, 1));
                  setView('days');
                }}
                style={{ width: '25%', height: CELL, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.full,
                    backgroundColor: active ? palette.primary : 'transparent',
                  }}
                >
                  <Text variant="labelLg" color={active ? 'onPrimary' : 'onSurface'}>
                    {MONTH_SHORT_FMT.format(new Date(2026, mIdx, 1))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((w, i) => (
              <View key={`${w}-${i}`} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}>
                <Text variant="labelSm" color="onSurfaceVariant">
                  {w}
                </Text>
              </View>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row' }}>
              {week.map((cell, ci) => {
                if (!cell) return <View key={ci} style={{ flex: 1, height: CELL }} />;
                const disabled = isDisabled(cell.date);
                const isSelected =
                  cell.iso === selected || cell.iso === rangeFrom || cell.iso === rangeTo;
                const inRange =
                  !!rangeFrom && !!rangeTo && cell.iso > rangeFrom && cell.iso < rangeTo;
                const isToday = cell.iso === todayIso;
                return (
                  <Pressable
                    key={ci}
                    disabled={disabled}
                    onPress={() => onSelectDay(cell.iso)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled }}
                    style={{
                      flex: 1,
                      height: CELL,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: inRange ? palette.primaryContainer : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: CELL - 6,
                        height: CELL - 6,
                        borderRadius: radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? palette.primary : 'transparent',
                        borderWidth: isToday && !isSelected ? 1.5 : 0,
                        borderColor: palette.primary,
                        opacity: disabled ? 0.35 : 1,
                      }}
                    >
                      <Text
                        variant="labelLg"
                        color={isSelected ? 'onPrimary' : inRange ? 'onPrimaryContainer' : 'onSurface'}
                      >
                        {cell.date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}
    </View>
  );
}
