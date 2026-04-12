import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, StyleSheet, SectionList, ActivityIndicator,
  SafeAreaView, RefreshControl, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/common/constants/colors';
import { Spacing, Layout } from '@/common/constants/spacing';
import { useAcademicYearContext } from '@/modules/academics/context/AcademicYearContext';
import { useHolidays } from '../hooks/useHolidays';
import { HolidayListItem } from '../components/HolidayListItem';
import { Holiday } from '../types';

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
  const { selectedAcademicYearId } = useAcademicYearContext();
  const {
    holidays, recurringHolidays, loading, error,
    fetchHolidays, fetchRecurring,
  } = useHolidays();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

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
      <SafeAreaView style={styles.container}>
        <ScreenHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={17} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('screen.searchPlaceholder')}
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {(['all', 'upcoming', 'recurring'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {t(`tabs.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error state */}
      {!!error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Summary counts */}
      {!error && (
        <View style={styles.summaryRow}>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCountText}>{section.data.length}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>{t('empty.title')}</Text>
            <Text style={styles.emptySubtitle}>{t('empty.hintReadOnly')}</Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScreenHeader() {
  const { t } = useTranslation('holidays');
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('screen.title')}</Text>
      <Text style={styles.headerSubtitle}>{t('screen.subtitle')}</Text>
    </View>
  );
}

function SummaryChip({ count, label }: { count: number; label: string }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={styles.summaryCount}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: { fontSize: 28, fontWeight: '600', color: Colors.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text, paddingVertical: 12 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: Colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.background },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
  },
  summaryCount: { fontSize: 20, fontWeight: '600', color: Colors.text, letterSpacing: -0.3 },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '400' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: Spacing.md,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.2 },
  sectionCountText: { fontSize: 12, fontWeight: '500', color: Colors.textTertiary },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, flexGrow: 1 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: '#FFF5F5', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    padding: Spacing.sm, borderRadius: Layout.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.error + '35',
  },
  errorText: { fontSize: 13, color: Colors.error, flex: 1 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 280 },
});
