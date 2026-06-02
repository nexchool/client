import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, StyleSheet, SectionList, ActivityIndicator,
  RefreshControl, TextInput, Pressable,
} from 'react-native';
import { useTheme, Spacing } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { Protected } from '@/modules/permissions/components/Protected';
import * as PERMS from '@/modules/permissions/constants/permissions';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';
import { useHolidays } from '../hooks/useHolidays';
import { HolidayListItem } from '../components/HolidayListItem';
import { HolidayFormModal } from '../components/HolidayFormModal';
import { Holiday, CreateHolidayDTO } from '../types';

type FilterTab = 'all' | 'upcoming' | 'recurring';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function HolidaysScreen() {
  const { t } = useTranslation('holidays');
  const { palette, spacing, radius, elevation } = useTheme();
  const { selectedAcademicYearId } = useAcademicYearContext();
  const {
    holidays, recurringHolidays, loading, error,
    fetchHolidays, fetchRecurring, createHoliday,
  } = useHolidays();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const handleCreateSubmit = useCallback(async (data: CreateHolidayDTO) => {
    await createHoliday(data);
    setShowFormModal(false);
  }, [createHoliday]);

  const loadData = useCallback(() => {
    fetchHolidays({
      search: debouncedSearch || undefined,
      academic_year_id: selectedAcademicYearId || undefined,
    });
    fetchRecurring();
  }, [debouncedSearch, selectedAcademicYearId, fetchHolidays, fetchRecurring]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Section data ──────────────────────────────────────────────────────────
  const sections = useMemo(() => {
    const list: { title: string; data: Holiday[] }[] = [];

    if (activeTab === 'all' || activeTab === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      const validHolidays = holidays.filter((h): h is Holiday => !!h?.id);
      const filtered = activeTab === 'upcoming'
        ? validHolidays.filter((h) => h.start_date && h.start_date >= today)
        : validHolidays;
      if (filtered.length) list.push({ title: t('sections.holidays'), data: filtered });
    }

    if (activeTab === 'all' || activeTab === 'recurring') {
      const validRecurring = recurringHolidays.filter((h): h is Holiday => !!h?.id);
      if (validRecurring.length) list.push({ title: t('sections.weeklyOff'), data: validRecurring });
    }

    return list;
  }, [activeTab, holidays, recurringHolidays, t]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading && !holidays.length && !recurringHolidays.length) {
    return (
      <View style={[styles.container, { backgroundColor: palette.surface }]}>
        <ScreenHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.surface }]}>
      <ScreenHeader />

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: radius.md,
            borderColor: palette.outlineVariant,
            marginHorizontal: spacing.marginMobile,
            marginTop: spacing.xs,
            marginBottom: spacing.sm,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <AppIcon name="search" size="md" color="onSurfaceVariant" />
        <TextInput
          style={[styles.searchInput, { color: palette.onSurface }]}
          placeholder={t('screen.searchPlaceholder')}
          placeholderTextColor={palette.onSurfaceVariant}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <AppIcon
            name="close-circle"
            size="md"
            color="onSurfaceVariant"
            onPress={() => setSearch('')}
            accessibilityLabel="Clear search"
          />
        )}
      </View>

      {/* Filter tabs */}
      <View style={[styles.tabRow, { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.sm }]}>
        {(['all', 'upcoming', 'recurring'] as FilterTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: active ? palette.onSurface : palette.surfaceContainerLowest,
                  borderColor: active ? palette.onSurface : palette.outlineVariant,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text variant="labelMd" style={{ color: active ? palette.surface : palette.onSurfaceVariant }}>
                {t(`tabs.${tab}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Error state */}
      {!!error && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: palette.errorContainer,
              marginHorizontal: spacing.marginMobile,
              marginBottom: spacing.sm,
              padding: spacing.sm,
              borderRadius: radius.md,
              borderColor: palette.error + '35',
              gap: spacing.xs,
            },
          ]}
        >
          <AppIcon name="alert-circle-outline" size="sm" color="error" />
          <Text variant="labelMd" color="error" style={styles.flex}>{error}</Text>
        </View>
      )}

      {/* Summary counts */}
      {!error && (
        <View style={[styles.summaryRow, { paddingHorizontal: spacing.marginMobile, gap: spacing.md, marginBottom: spacing.md }]}>
          <SummaryChip count={holidays.length} label={t('summary.holidays')} />
          <SummaryChip count={recurringHolidays.length} label={t('summary.weeklyOff')} />
        </View>
      )}

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        renderItem={({ item }) => <HolidayListItem holiday={item} />}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
            <Text variant="labelSm" color="onSurfaceVariant">{section.title}</Text>
            <Text variant="labelSm" color="onSurfaceVariant">{section.data.length}</Text>
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingBottom: spacing[40] * 2.5,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={palette.primary} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <AppIcon name="calendar-outline" size="hero" color="outline" />
            <Text variant="titleSm" color="onSurface" style={{ marginTop: spacing.lg }}>
              {t('empty.title')}
            </Text>
            <Text variant="bodySm" color="onSurfaceVariant" style={styles.emptySubtitle}>
              {t('empty.hintReadOnly')}
            </Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
      />

      <Protected permission={PERMS.HOLIDAY_CREATE}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add holiday"
          onPress={() => setShowFormModal(true)}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: spacing.lg,
            right: spacing.marginMobile,
            width: 56,
            height: 56,
            borderRadius: 28,
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

      <HolidayFormModal
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleCreateSubmit}
        mode="create"
      />
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScreenHeader() {
  const { t } = useTranslation('holidays');
  const { palette, spacing } = useTheme();
  return (
    <View
      style={[
        styles.header,
        {
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          backgroundColor: palette.surface,
        },
      ]}
    >
      <Text variant="headlineLg" color="onSurface">{t('screen.title')}</Text>
      <Text variant="bodySm" color="onSurfaceVariant" style={{ marginTop: 4 }}>
        {t('screen.subtitle')}
      </Text>
    </View>
  );
}

function SummaryChip({ count, label }: { count: number; label: string }) {
  const { palette, spacing, radius } = useTheme();
  return (
    <View
      style={[
        styles.summaryChip,
        {
          backgroundColor: palette.surfaceContainerLowest,
          borderColor: palette.outlineVariant,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <Text variant="headlineMd" color="onSurface">{count}</Text>
      <Text variant="bodySm" color="onSurfaceVariant">{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  header: {},
  flex: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, paddingVertical: 12, padding: 0 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptySubtitle: { textAlign: 'center', marginTop: 8, maxWidth: 280 },
});
