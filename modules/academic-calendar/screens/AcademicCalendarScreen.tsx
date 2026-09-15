import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { calendarLocaleForLanguage } from '@/i18n';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PageHeader } from '@/common/components/PageHeader';
import { EmptyState } from '@/common/components/EmptyState';
import { Skeleton } from '@/common/components/Skeleton';
import { schoolTodayIso } from '@/common/utils/datetime';
import { useCurrentCalendar } from '../hooks/useCurrentCalendar';
import { CalendarMonthGrid } from '../components/CalendarMonthGrid';
import { CalendarLegend } from '../components/CalendarLegend';
import { CalendarDayCard } from '../components/CalendarDayCard';
import {
  kindForDayType,
  type CalendarDay,
  type CalendarEntryKind,
  type CurrentCalendar,
} from '../types';

type Entry = {
  kind: CalendarEntryKind;
  title: string;
  badge?: string | null;
  subtitle?: string | null;
};

const SKELETON_GRID_H = 300;

function monthOf(iso: string): Date {
  const [year, month] = iso.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * Everything happening on one day, in the order a reader cares about: why the
 * school is closed first, then what is on.
 */
function entriesFor(
  iso: string,
  day: CalendarDay | undefined,
  calendar: CurrentCalendar,
  t: (key: string, options?: Record<string, unknown>) => string
): Entry[] {
  const out: Entry[] = [];

  for (const holiday of day?.holidays ?? []) {
    const isVacation = holiday.holidayType === 'vacation';
    out.push({
      kind: isVacation ? 'vacation' : 'holiday',
      title: holiday.name,
      badge: holiday.holidayType
        ? t(`holidayTypes.${holiday.holidayType}`, {
            defaultValue: holiday.holidayType,
          })
        : null,
    });
  }

  // A weekly off has no holiday row behind it — it is derived from the
  // school's weekly pattern — so it would otherwise leave the day blank.
  if (day && kindForDayType(day.dayType) === 'weeklyOff' && out.length === 0) {
    out.push({ kind: 'weeklyOff', title: t('weeklyOff') });
  }

  for (const window of calendar.examWindows) {
    if (!window.startDate || !window.endDate) continue;
    if (iso >= window.startDate && iso <= window.endDate) {
      out.push({
        kind: 'exam',
        title: window.name,
        badge: window.examType
          ? t(`examTypes.${window.examType}`, { defaultValue: window.examType })
          : null,
        subtitle: window.description,
      });
    }
  }

  for (const event of calendar.events) {
    if (event.eventDate !== iso) continue;
    out.push({
      kind: 'event',
      title: event.name,
      badge: event.eventType
        ? t(`eventTypes.${event.eventType}`, { defaultValue: event.eventType })
        : null,
      subtitle: event.description,
    });
  }

  if (day?.semesterStart) {
    out.push({ kind: 'term', title: t('termStarts', { name: day.semesterStart }) });
  }
  if (day?.semesterEnd) {
    out.push({ kind: 'term', title: t('termEnds', { name: day.semesterEnd }) });
  }

  return out;
}

/**
 * The school's calendar, read-only.
 *
 * Everything on it is already narrowed by the server to what the person
 * signed in may see — a teacher's own classes' exams, a student's own class's
 * — so there is nothing to filter here and no way for this screen to ask for
 * more than it is entitled to.
 */
export default function AcademicCalendarScreen() {
  const { t, i18n } = useTranslation('academicCalendar');
  const { palette, spacing, radius } = useTheme();
  const locale = calendarLocaleForLanguage(i18n.language ?? 'en');
  const { data: calendar, isLoading, isError, refetch, isRefetching } =
    useCurrentCalendar();

  const today = schoolTodayIso();
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [month, setMonth] = useState<Date | null>(null);

  const daysByIso = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const day of calendar?.days ?? []) map.set(day.date, day);
    return map;
  }, [calendar]);

  // Today, unless the year has not started or has ended — a school opening the
  // app in May for a June year would otherwise land on an empty grid with
  // every cell greyed out and no hint that the calendar is elsewhere.
  const openingIso = useMemo(() => {
    if (!calendar || calendar.days.length === 0) return today;
    if (daysByIso.has(today)) return today;
    const first = calendar.days[0].date;
    const last = calendar.days[calendar.days.length - 1].date;
    return today < first ? first : last;
  }, [calendar, daysByIso, today]);

  const activeIso = selectedIso ?? openingIso;
  const activeMonth = month ?? monthOf(openingIso);

  const entries = useMemo(
    () =>
      calendar ? entriesFor(activeIso, daysByIso.get(activeIso), calendar, t) : [],
    [calendar, daysByIso, activeIso, t]
  );

  const contentInset = {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.md,
    paddingBottom: spacing.scrollBottom,
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: palette.surface }]}>
        <PageHeader title={t('screen.title')} />
        <View style={[contentInset, { gap: spacing.md }]}>
          <Skeleton width="100%" height={SKELETON_GRID_H} radius={radius.xl} />
          <Skeleton width="100%" height={96} radius={radius.xl} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: palette.surface }]}>
        <PageHeader title={t('screen.title')} />
        <View style={[styles.flex, styles.centered]}>
          <EmptyState
            icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
            title={t('errors.loadFailed')}
            action={{ label: t('errors.retry'), onPress: () => void refetch() }}
          />
        </View>
      </View>
    );
  }

  if (!calendar) {
    return (
      <View style={[styles.container, { backgroundColor: palette.surface }]}>
        <PageHeader title={t('screen.title')} />
        <View style={[styles.flex, styles.centered]}>
          <EmptyState
            icon={<AppIcon name="calendar-outline" size="xl" color="onSurfaceVariant" />}
            title={t('empty.title')}
            description={t('empty.description')}
          />
        </View>
      </View>
    );
  }

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(activeMonth);
  // Weekday initials taken from a known Sunday so the row starts where the
  // grid's leading blanks do (`Date.getDay()`, Sunday = 0).
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    weekdayFormat.format(new Date(2026, 5, 7 + index))
  );
  const selectedLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${activeIso}T00:00:00`));

  const stats = [
    { value: calendar.summary?.workingDays ?? 0, label: t('stats.workingDays') },
    { value: calendar.summary?.publicHolidayDays ?? 0, label: t('stats.holidays') },
    { value: calendar.summary?.totalDays ?? 0, label: t('stats.totalDays') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <PageHeader
        title={t('screen.title')}
        subtitle={calendar.academicYearName ?? undefined}
      />
      <ScrollView
        contentContainerStyle={contentInset}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
      >
        <View style={[styles.stats, { paddingBottom: spacing.md }]}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text variant="headlineMd">{String(stat.value)}</Text>
              <Text variant="labelSm" color="onSurfaceVariant">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <CalendarMonthGrid
          month={activeMonth}
          onMonthChange={setMonth}
          daysByIso={daysByIso}
          selectedIso={activeIso}
          onSelectDay={setSelectedIso}
          monthLabel={monthLabel}
          weekdayLabels={weekdayLabels}
          previousLabel={t('grid.previousMonth')}
          nextLabel={t('grid.nextMonth')}
        />

        <CalendarLegend />

        <Text variant="titleSm" style={{ marginBottom: spacing.sm }}>
          {selectedLabel}
        </Text>

        {entries.length === 0 ? (
          <Text variant="bodySm" color="onSurfaceVariant">
            {t('noEntries')}
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {entries.map((entry, index) => (
              <CalendarDayCard
                key={`${entry.kind}-${index}`}
                kind={entry.kind}
                title={entry.title}
                badge={entry.badge}
                subtitle={entry.subtitle}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
});
