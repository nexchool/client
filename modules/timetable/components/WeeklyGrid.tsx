import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import type { WeeklyTimetable, WeeklyPeriod } from '../types';
import { WeeklyGridCell } from './WeeklyGridCell';
import { PeriodDetailSheet } from './PeriodDetailSheet';

const TIME_COL_WIDTH = 56;
const DAY_COL_WIDTH = 140;
const CELL_HEIGHT = 92;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACCENTS = ['primary', 'secondary', 'tertiary'] as const;

type Props = {
  data: WeeklyTimetable;
  secondaryField: 'class' | 'teacher' | 'room';
};

function collectTimeSlots(data: WeeklyTimetable): string[] {
  const set = new Set<string>();
  for (const d of data.days) {
    for (const p of d.periods) set.add(p.start_time);
  }
  return Array.from(set).sort();
}

function isCurrentPeriod(period: WeeklyPeriod, dayDate: string, now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  if (dayDate !== today) return false;
  const [sh, sm] = period.start_time.split(':').map(Number);
  const [eh, em] = period.end_time.split(':').map(Number);
  const s = new Date(now);
  s.setHours(sh, sm, 0, 0);
  const e = new Date(now);
  e.setHours(eh, em, 0, 0);
  return now >= s && now <= e;
}

export function WeeklyGrid({ data, secondaryField }: Props) {
  const { palette, spacing, radius } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<WeeklyPeriod | null>(null);

  const timeSlots = useMemo(() => collectTimeSlots(data), [data]);
  const today = new Date().toISOString().slice(0, 10);

  // Stable accent per subject name so the same subject keeps one color.
  const accentBySubject = useMemo(() => {
    const map = new Map<string, (typeof ACCENTS)[number]>();
    let i = 0;
    for (const d of data.days) {
      for (const p of d.periods) {
        const key = p.subject?.name ?? p.id;
        if (!map.has(key)) {
          map.set(key, ACCENTS[i % ACCENTS.length]);
          i += 1;
        }
      }
    }
    return map;
  }, [data]);

  if (timeSlots.length === 0) {
    return (
      <View style={{ padding: spacing.xl, alignItems: 'center' }}>
        <Text variant="bodyMd" color="onSurfaceVariant">
          No periods this week.
        </Text>
      </View>
    );
  }

  // Sort days by day_of_week (0..6) so render order is always Mon → Sun.
  const sortedDays = [...data.days].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.row}>
            <View style={{ width: TIME_COL_WIDTH }} />
            {sortedDays.map((d) => {
              const isToday = d.date === today;
              return (
                <View
                  key={d.day_of_week}
                  style={{
                    width: DAY_COL_WIDTH,
                    paddingVertical: spacing.sm,
                    alignItems: 'center',
                    borderRadius: radius.md,
                    backgroundColor: isToday ? palette.primaryContainer : 'transparent',
                  }}
                >
                  <Text variant="overline" color={isToday ? 'onPrimaryContainer' : 'onSurfaceVariant'}>
                    {DAY_LABELS[d.day_of_week] ?? ''}
                  </Text>
                  <Text
                    variant="labelMd"
                    color={isToday ? 'onPrimaryContainer' : 'onSurface'}
                    style={{ marginTop: 2 }}
                  >
                    {d.date.slice(8, 10)}
                  </Text>
                </View>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {timeSlots.map((slot) => (
              <View key={slot} style={styles.row}>
                <View
                  style={{
                    width: TIME_COL_WIDTH,
                    height: CELL_HEIGHT,
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end',
                    paddingTop: spacing.sm,
                    paddingRight: spacing.xs,
                  }}
                >
                  <Text variant="labelSm" color="onSurfaceVariant">
                    {slot}
                  </Text>
                </View>
                {sortedDays.map((d) => {
                  const period = d.periods.find((p) => p.start_time === slot) ?? null;
                  const current = period ? isCurrentPeriod(period, d.date) : false;
                  const accent = period
                    ? accentBySubject.get(period.subject?.name ?? period.id) ?? 'primary'
                    : 'primary';
                  return (
                    <View key={d.day_of_week} style={{ width: DAY_COL_WIDTH, padding: 4 }}>
                      <WeeklyGridCell
                        period={period}
                        width={DAY_COL_WIDTH - 8}
                        height={CELL_HEIGHT - 8}
                        isCurrent={current}
                        accent={accent}
                        secondaryField={secondaryField}
                        onPress={period ? () => setSelectedPeriod(period) : undefined}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <PeriodDetailSheet
        period={selectedPeriod}
        visible={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
