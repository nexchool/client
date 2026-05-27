import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/common/theme';
import type { WeeklyTimetable, WeeklyPeriod } from '../types';
import { WeeklyGridCell } from './WeeklyGridCell';
import { PeriodDetailSheet } from './PeriodDetailSheet';

const TIME_COL_WIDTH = 60;
const DAY_COL_WIDTH = 130;
const CELL_HEIGHT = 72;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const { palette, spacing, typography } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<WeeklyPeriod | null>(null);

  const timeSlots = useMemo(() => collectTimeSlots(data), [data]);
  const today = new Date().toISOString().slice(0, 10);

  if (timeSlots.length === 0) {
    return (
      <View style={{ padding: spacing.xl, alignItems: 'center' }}>
        <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant }]}>
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
          <View style={[styles.row, { backgroundColor: palette.surface }]}>
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
                    backgroundColor: isToday ? `${palette.primary}14` : 'transparent',
                  }}
                >
                  <Text
                    style={[
                      typography.labelSm,
                      {
                        color: isToday ? palette.primary : palette.onSurfaceVariant,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      },
                    ]}
                  >
                    {DAY_LABELS[d.day_of_week] ?? ''}
                  </Text>
                  <Text
                    style={[
                      typography.labelMd,
                      {
                        color: isToday ? palette.primary : palette.onSurface,
                        marginTop: 2,
                        fontFamily: isToday ? 'Inter_600SemiBold' : 'Inter_500Medium',
                      },
                    ]}
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
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={[typography.labelSm, { color: palette.onSurfaceVariant }]}>
                    {slot}
                  </Text>
                </View>
                {sortedDays.map((d) => {
                  const period = d.periods.find((p) => p.start_time === slot) ?? null;
                  const current = period ? isCurrentPeriod(period, d.date) : false;
                  return (
                    <View key={d.day_of_week} style={{ width: DAY_COL_WIDTH, padding: 4 }}>
                      <WeeklyGridCell
                        period={period}
                        width={DAY_COL_WIDTH - 8}
                        height={CELL_HEIGHT - 8}
                        isCurrent={current}
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
