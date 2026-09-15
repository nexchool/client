import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { ENTRY_ACCENTS, kindForDayType, type CalendarDay } from '../types';

const CELL = 44; // TouchTarget.min

type Cell = { iso: string; day: number } | null;

export interface CalendarMonthGridProps {
  /** Any date inside the month being shown. */
  month: Date;
  onMonthChange: (next: Date) => void;
  /** The whole year's feed keyed by ISO date, so a cell is an O(1) lookup. */
  daysByIso: Map<string, CalendarDay>;
  selectedIso: string;
  onSelectDay: (iso: string) => void;
  monthLabel: string;
  weekdayLabels: string[];
  previousLabel: string;
  nextLabel: string;
}

function toIso(year: number, month: number, day: number): string {
  const m = `${month + 1}`.padStart(2, '0');
  const d = `${day}`.padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Built from calendar arithmetic rather than `Date.toISOString`, which is UTC
 * and drifts a day backwards in IST — the same trap the admin-web calendar
 * had to fix.
 */
function buildWeeks(month: Date): Cell[][] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const leading = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: Cell[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toIso(year, m, day), day });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * A month at a glance, with a dot per thing happening on each day.
 *
 * A sibling of `common/components/datepicker/MonthGrid`, not a reuse of it:
 * that grid exists to pick a date and carries no marks, and teaching it to
 * render a calendar would have made one component answer two questions.
 */
export function CalendarMonthGrid({
  month,
  onMonthChange,
  daysByIso,
  selectedIso,
  onSelectDay,
  monthLabel,
  weekdayLabels,
  previousLabel,
  nextLabel,
}: CalendarMonthGridProps) {
  const { palette, spacing, radius } = useTheme();
  const weeks = useMemo(() => buildWeeks(month), [month]);

  // Up to three marks on a day — what kind of day it is, an exam, an event —
  // so they are a row of dots rather than one colour asked to mean three
  // things at once.
  const marksFor = (entry: CalendarDay | undefined): string[] => {
    if (!entry) return [];
    const marks: string[] = [];
    const dayKind = kindForDayType(entry.dayType);
    if (dayKind) marks.push(palette[ENTRY_ACCENTS[dayKind]]);
    if (entry.hasExam) marks.push(palette[ENTRY_ACCENTS.exam]);
    if (entry.hasEvent) marks.push(palette[ENTRY_ACCENTS.event]);
    return marks;
  };

  const shiftMonth = (by: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <View>
      <View style={[styles.header, { paddingHorizontal: spacing.sm }]}>
        <Pressable
          onPress={() => shiftMonth(-1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={previousLabel}
          style={styles.arrow}
        >
          <AppIcon name="chevron-back" size="lg" color="onSurface" />
        </Pressable>
        <Text variant="titleSm">{monthLabel}</Text>
        <Pressable
          onPress={() => shiftMonth(1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          style={styles.arrow}
        >
          <AppIcon name="chevron-forward" size="lg" color="onSurface" />
        </Pressable>
      </View>

      <View style={styles.row}>
        {weekdayLabels.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.cell}>
            <Text variant="labelSm" color="onSurfaceVariant">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((cell, cellIndex) => {
            if (!cell) {
              return <View key={`blank-${cellIndex}`} style={styles.emptyCell} />;
            }
            const entry = daysByIso.get(cell.iso);
            const marks = marksFor(entry);
            const isSelected = cell.iso === selectedIso;
            const isOutsideYear = entry === undefined;
            return (
              <Pressable
                key={cell.iso}
                onPress={() => onSelectDay(cell.iso)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.dayCell,
                  {
                    borderRadius: radius.md,
                    backgroundColor: isSelected
                      ? palette.primaryContainer
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="bodySm"
                  color={
                    isSelected
                      ? 'onPrimaryContainer'
                      : isOutsideYear
                        ? 'outline'
                        : 'onSurface'
                  }
                >
                  {cell.day}
                </Text>
                <View style={styles.marks}>
                  {marks.map((color, index) => (
                    <View
                      key={index}
                      style={[styles.dot, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center' },
  emptyCell: { flex: 1, height: CELL },
  dayCell: { flex: 1, height: CELL, alignItems: 'center', justifyContent: 'center' },
  marks: { flexDirection: 'row', gap: 2, height: 6, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
