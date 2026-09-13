import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { calendarLocaleForLanguage } from '@/i18n';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { PageHeader } from '@/common/components/PageHeader';
import { EmptyState } from '@/common/components/EmptyState';
import { FilterChips } from '@/common/components/FilterChips';
import { SearchFilterBar } from '@/common/components/SearchFilterBar';
import { Skeleton } from '@/common/components/Skeleton';
import { useDialog, useToast } from '@/common/feedback';
import { Protected } from '@/modules/permissions/components/Protected';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';
import { useHolidays } from '../hooks/useHolidays';
import { HolidayListItem } from '../components/HolidayListItem';
import { Holiday } from '../types';
import { schoolTodayIso } from '@/common/utils/datetime';

type FilterTab = 'upcoming' | 'all' | 'past' | 'weekly';

const TABS: readonly FilterTab[] = ['upcoming', 'all', 'past', 'weekly'];

const TAB_LABEL_KEYS: Record<FilterTab, string> = {
  upcoming: 'tabs.upcoming',
  all: 'tabs.all',
  past: 'tabs.past',
  weekly: 'tabs.weeklyOff',
};

/** Roughly one card of name, dates and a note — what the skeleton stands in for. */
const SKELETON_CARD_H = 112;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function HolidaysScreen() {
  const { t, i18n } = useTranslation('holidays');
  const { palette, spacing, radius, elevation } = useTheme();
  const locale = calendarLocaleForLanguage(i18n.language ?? 'en');
  const { confirm } = useDialog();
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const { selectedAcademicYearId } = useAcademicYearContext();
  const {
    holidays, recurringHolidays, loading, error,
    fetchHolidays, fetchRecurring, deleteHoliday,
  } = useHolidays();

  // "What is coming up" is the question a school calendar is opened with.
  // The whole year is one chip away.
  const [activeTab, setActiveTab] = useState<FilterTab>('upcoming');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const canUpdate = hasPermission(PERMS.HOLIDAY_UPDATE);
  const canDelete = hasPermission(PERMS.HOLIDAY_DELETE);
  const canCreate = hasPermission(PERMS.HOLIDAY_CREATE);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchHolidays({
        search: debouncedSearch || undefined,
        academic_year_id: selectedAcademicYearId || undefined,
      }),
      fetchRecurring(),
    ]);
  }, [debouncedSearch, selectedAcademicYearId, fetchHolidays, fetchRecurring]);

  // On focus rather than on mount: the add and edit forms are screens of
  // their own now, and coming back from one has to show what it just saved.
  useFocusEffect(useCallback(() => { void loadData(); }, [loadData]));

  // Pull-to-refresh gets its own flag. Bound to `loading`, the spinner used to
  // appear on every keystroke in the search box, as if the list were being
  // dragged down by itself.
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  // The API filters dated holidays by `search`; the recurring endpoint takes no
  // query, so the same term is applied here rather than leaving the weekly-off
  // chip showing everything while the others are filtered.
  const weeklyOffs = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const valid = recurringHolidays.filter((h): h is Holiday => !!h?.id);
    if (!term) return valid;
    return valid.filter((h) => h.name?.toLowerCase().includes(term));
  }, [recurringHolidays, debouncedSearch]);

  const dated = useMemo(
    () => holidays.filter((h): h is Holiday => !!h?.id && !!h.start_date),
    [holidays],
  );

  const hasAny = dated.length > 0 || weeklyOffs.length > 0;

  // A failed refresh over a list that already has rows should say so without
  // wiping the rows; a failed first load has nothing to keep and gets the
  // full-screen state below.
  useEffect(() => {
    if (error && hasAny) toast.error(error);
    // Deliberately not keyed on `hasAny`: the toast is for a new error, not a
    // list that filled in later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, toast]);

  const { upcoming, past } = useMemo(() => {
    const today = schoolTodayIso();
    const up: Holiday[] = [];
    const done: Holiday[] = [];
    for (const h of dated) {
      // A week-long holiday is still running on its third day, so the end date
      // decides — by the start date alone it would drop into "Past" the morning
      // after it began.
      const finishes = h.end_date || h.start_date!;
      (finishes >= today ? up : done).push(h);
    }
    return { upcoming: up, past: done };
  }, [dated]);

  const counts: Record<FilterTab, number> = {
    upcoming: upcoming.length,
    all: dated.length,
    past: past.length,
    weekly: weeklyOffs.length,
  };

  const sections = useMemo(() => {
    if (activeTab === 'weekly') {
      return weeklyOffs.length
        ? [{ key: 'weekly', title: t('sections.weeklyOff'), data: weeklyOffs }]
        : [];
    }

    const source =
      activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : dated;

    // Grouped by the month they fall in — the unit a calendar is actually read
    // in, and the reason a year of holidays no longer arrives as one long list.
    const byMonth = new Map<string, Holiday[]>();
    for (const h of source) {
      const key = h.start_date!.slice(0, 7);
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(h);
      else byMonth.set(key, [h]);
    }

    const keys = [...byMonth.keys()].sort();
    // Most recent first when looking backwards; soonest first otherwise.
    if (activeTab === 'past') keys.reverse();

    return keys.map((key) => {
      const [year, month] = key.split('-');
      const title = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
        locale,
        { month: 'long', year: 'numeric' },
      );
      const data = byMonth.get(key)!.sort((a, b) =>
        activeTab === 'past'
          ? (b.start_date ?? '').localeCompare(a.start_date ?? '')
          : (a.start_date ?? '').localeCompare(b.start_date ?? ''),
      );
      return { key, title, data };
    });
  }, [activeTab, upcoming, past, dated, weeklyOffs, locale, t]);

  const openCreate = useCallback(() => {
    router.push('/(protected)/holidays/new' as never);
  }, []);

  const handleEdit = useCallback((holiday: Holiday) => {
    router.push({ pathname: '/(protected)/holidays/[id]/edit', params: { id: holiday.id } } as never);
  }, []);

  const handleDelete = useCallback(async (holiday: Holiday) => {
    const recurringPart = holiday.is_recurring
      ? t('alerts.recurringPart', { day: holiday.recurring_day_name ?? '' })
      : '';
    const confirmed = await confirm({
      title: t('alerts.deleteTitle'),
      description: t('alerts.deleteMessage', { name: holiday.name, recurringPart }),
      tone: 'danger',
      confirmLabel: t('alerts.delete'),
      cancelLabel: t('alerts.cancel'),
    });
    if (!confirmed) return;
    try {
      await deleteHoliday(holiday.id, holiday.is_recurring);
      toast.success(t('alerts.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('alerts.deleteFailed'));
    }
  }, [confirm, deleteHoliday, t, toast]);

  /** Why this list is empty, in the words of the tab that emptied it. */
  const emptyState = useMemo(() => {
    if (search.trim()) {
      return {
        title: t('empty.noMatchTitle'),
        description: t('empty.noMatchBody'),
        action: { label: t('screen.clearSearch'), onPress: () => setSearch('') },
      };
    }
    // Nothing anywhere is a different message to nothing in this one tab.
    if (!hasAny) {
      return {
        title: t('empty.title'),
        description: t('empty.body'),
        action: canCreate ? { label: t('empty.addFirst'), onPress: openCreate } : undefined,
      };
    }
    const showAll = { label: t('empty.showAll'), onPress: () => setActiveTab('all') };
    if (activeTab === 'upcoming') {
      return { title: t('empty.noUpcomingTitle'), description: t('empty.noUpcomingBody'), action: showAll };
    }
    if (activeTab === 'past') {
      return { title: t('empty.noPastTitle'), description: t('empty.noPastBody'), action: showAll };
    }
    if (activeTab === 'weekly') {
      return { title: t('empty.noWeeklyOffTitle'), description: t('empty.noWeeklyOffBody'), action: showAll };
    }
    return { title: t('empty.title'), description: t('empty.body'), action: undefined };
  }, [search, hasAny, activeTab, canCreate, openCreate, t]);

  const firstLoad = loading && !hasAny && !error;
  const failedFirstLoad = !!error && !hasAny;

  // Search and chips scroll with the list — the students list settled that,
  // and it is what lets the toolbar and the cards share one inset and one gap
  // instead of the header, the toolbar and the list each bringing their own.
  const toolbar = (
    <View style={{ gap: spacing[12] }}>
      <SearchFilterBar
        value={search}
        onChangeText={setSearch}
        placeholder={t('screen.searchPlaceholder')}
        clearSearchLabel={t('screen.clearSearch')}
      />
      <FilterChips
        options={TABS.map((tab) => ({
          value: tab,
          label: t(TAB_LABEL_KEYS[tab]),
          count: counts[tab],
        }))}
        value={activeTab}
        onChange={setActiveTab}
      />
    </View>
  );

  const contentInset = {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.md,
    paddingBottom: spacing.scrollBottom,
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <PageHeader title={t('screen.title')} subtitle={t('screen.subtitle')} />

      {firstLoad ? (
        <View style={[contentInset, { gap: spacing.sm }]}>
          {toolbar}
          <View style={{ height: spacing.md }} />
          <Skeleton width="100%" height={SKELETON_CARD_H} radius={radius.xl} />
          <Skeleton width="100%" height={SKELETON_CARD_H} radius={radius.xl} />
          <Skeleton width="100%" height={SKELETON_CARD_H} radius={radius.xl} />
        </View>
      ) : failedFirstLoad ? (
        <View style={[contentInset, styles.flex]}>
          {toolbar}
          <View style={[styles.flex, styles.centered]}>
            <EmptyState
              icon={<AppIcon name="alert-circle-outline" size="xl" color="error" />}
              title={t('errors.loadFailed')}
              action={{ label: t('errors.retry'), onPress: () => void loadData() }}
            />
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={toolbar}
          renderItem={({ item }) => (
            <HolidayListItem
              holiday={item}
              onEdit={canUpdate ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                { marginTop: spacing.md, marginBottom: spacing.xs },
              ]}
            >
              <Text variant="labelMd" color="onSurfaceVariant">
                {section.title}
              </Text>
              <Text variant="labelSm" color="onSurfaceVariant">
                {section.data.length}
              </Text>
            </View>
          )}
          renderSectionFooter={() => <View style={{ height: spacing.sm }} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={[contentInset, { flexGrow: 1 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={palette.primary}
            />
          }
          ListEmptyComponent={
            <View style={[styles.flex, styles.centered]}>
              <EmptyState
                icon={<AppIcon name="calendar-outline" size="xl" color="onSurfaceVariant" />}
                title={emptyState.title}
                description={emptyState.description}
                action={emptyState.action}
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <Protected permission={PERMS.HOLIDAY_CREATE}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('empty.addFirst')}
          onPress={openCreate}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: spacing.lg,
            right: spacing.marginMobile,
            width: 56,
            height: 56,
            borderRadius: radius.full,
            backgroundColor: palette.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            ...elevation.card,
          })}
        >
          <AppIcon name="add" size="xl" color="onPrimary" />
        </Pressable>
      </Protected>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: { justifyContent: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
});
