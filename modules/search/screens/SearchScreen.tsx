// client/modules/search/screens/SearchScreen.tsx
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Input } from '@/common/components/Input';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { useSearch } from '../hooks/useSearch';
import { SearchGroupSection } from '../components/SearchGroupSection';
import { SearchResultRow } from '../components/SearchResultRow';

export default function SearchScreen() {
  const { t } = useTranslation('search');
  const { palette, spacing, typography } = useTheme();
  const { query, setQuery, enabled, results, isFetching } = useSearch();

  const go = (pathname: string, id: string) => router.push({ pathname, params: { id } } as any);

  const totalHits =
    (results?.students.length ?? 0) +
    (results?.teachers.length ?? 0) +
    (results?.classes.length ?? 0) +
    (results?.fees.length ?? 0);

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 44, height: 44, justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Input
            label=""
            value={query}
            onChangeText={setQuery}
            placeholder={t('placeholder', { defaultValue: 'Search students, teachers, classes, fees' })}
            autoCapitalize="none"
            rightSlot={
              query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={palette.onSurfaceVariant} />
                </Pressable>
              ) : undefined
            }
          />
        </View>
      </View>

      {!enabled ? (
        <View style={{ alignItems: 'center', marginTop: spacing.xl * 2 }}>
          <Ionicons name="search-outline" size={48} color={palette.outlineVariant} />
          <Text style={[typography.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.md }]}>
            {t('prompt', { defaultValue: 'Type to search' })}
          </Text>
        </View>
      ) : isFetching ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={56} radius={12} />
          ))}
        </View>
      ) : totalHits === 0 ? (
        <EmptyState
          icon={<Ionicons name="search-outline" size={28} color={palette.onSurfaceVariant} />}
          title={t('empty.title', { defaultValue: 'No matches' })}
          description={t('empty.body', { defaultValue: 'Nothing found for your search.' })}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <SearchGroupSection
            title={t('group.students', { defaultValue: 'Students' })}
            count={results?.students.length ?? 0}
            showSeeAll={(results?.students.length ?? 0) >= 5}
            onSeeAll={() => router.push('/(protected)/students')}
          >
            {results?.students.map((s) => (
              <SearchResultRow
                key={s.id}
                icon="person-outline"
                primary={s.name ?? '—'}
                secondary={[s.admission_number, s.class_name].filter(Boolean).join(' · ') || null}
                onPress={() => go('/(protected)/students/[id]', s.id)}
              />
            ))}
          </SearchGroupSection>

          <SearchGroupSection
            title={t('group.teachers', { defaultValue: 'Teachers' })}
            count={results?.teachers.length ?? 0}
            showSeeAll={(results?.teachers.length ?? 0) >= 5}
            onSeeAll={() => router.push('/(protected)/teachers')}
          >
            {results?.teachers.map((tch) => (
              <SearchResultRow
                key={tch.id}
                icon="briefcase-outline"
                primary={tch.name ?? '—'}
                secondary={tch.employee_id}
                onPress={() => go('/(protected)/teachers/[id]', tch.id)}
              />
            ))}
          </SearchGroupSection>

          <SearchGroupSection
            title={t('group.classes', { defaultValue: 'Classes' })}
            count={results?.classes.length ?? 0}
            showSeeAll={(results?.classes.length ?? 0) >= 5}
            onSeeAll={() => router.push('/(protected)/classes')}
          >
            {results?.classes.map((c) => (
              <SearchResultRow
                key={c.id}
                icon="school-outline"
                primary={[c.name, c.section].filter(Boolean).join(' - ') || '—'}
                onPress={() => go('/(protected)/classes/[id]', c.id)}
              />
            ))}
          </SearchGroupSection>

          <SearchGroupSection
            title={t('group.fees', { defaultValue: 'Fees' })}
            count={results?.fees.length ?? 0}
            showSeeAll={(results?.fees.length ?? 0) >= 5}
            onSeeAll={() => router.push('/(protected)/finance/invoices')}
          >
            {results?.fees.map((f) => (
              <SearchResultRow
                key={f.id}
                icon="receipt-outline"
                primary={f.invoice_number ?? '—'}
                secondary={[f.student_name, f.status].filter(Boolean).join(' · ') || null}
                onPress={() => go('/(protected)/finance/invoices/[id]', f.id)}
              />
            ))}
          </SearchGroupSection>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
