// client/modules/search/screens/SearchScreen.tsx
import React, { useCallback } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { Skeleton } from '@/common/components/Skeleton';
import { EmptyState } from '@/common/components/EmptyState';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { useSearch } from '../hooks/useSearch';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { SearchGroupSection } from '../components/SearchGroupSection';
import { SearchResultRow } from '../components/SearchResultRow';
import { RecentSearches } from '../components/RecentSearches';

/**
 * Snake_case as the server stores it is not a word anyone says. Title-casing
 * the server's own vocabulary keeps the meaning exactly as it is rather than
 * inventing a label the rest of the product does not use.
 */
function humanise(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function SearchScreen() {
  const { t } = useTranslation('search');
  const { palette, spacing, radius } = useTheme();
  const { query, setQuery, debounced, enabled, results, isInitialLoad } = useSearch();
  const { recents, remember, forget, clear } = useRecentSearches();

  const totalHits =
    (results?.students.length ?? 0) +
    (results?.teachers.length ?? 0) +
    (results?.classes.length ?? 0) +
    (results?.fees.length ?? 0);

  // Opening a result is the clearest signal a search was the one they meant.
  const go = useCallback(
    (pathname: string, id: string) => {
      remember(debounced);
      router.push({ pathname, params: { id } } as any);
    },
    [remember, debounced]
  );

  // "See all" used to land on an unfiltered list, silently dropping the term
  // the person had just typed — they arrived at every student in the school
  // and had to type it again. The students and teachers lists have a search
  // field to receive it, so it travels with them.
  const seeAllWithQuery = useCallback(
    (pathname: string) => {
      remember(debounced);
      router.push({ pathname, params: { q: debounced } } as any);
    },
    [remember, debounced]
  );

  // Classes and invoices have no search field to hand the term to. Sending a
  // `q` they ignore would look like it had been applied when it had not.
  const seeAll = useCallback(
    (pathname: string) => {
      remember(debounced);
      router.push(pathname as any);
    },
    [remember, debounced]
  );

  return (
    <ScreenContainer topInset={false} scrollable={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppIcon
          name="chevron-back"
          size="lg"
          color="onSurface"
          onPress={() => router.back()}
          accessibilityLabel={t('back', { defaultValue: 'Back' })}
        />
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderRadius: radius.DEFAULT,
            borderColor: palette.outlineVariant,
            backgroundColor: palette.surfaceContainerLowest,
          }}
        >
          <AppIcon name="search" size="md" color="outline" />
          <TextInput
            style={{ flex: 1, padding: 0, color: palette.onSurface }}
            value={query}
            onChangeText={setQuery}
            placeholder={t('placeholder', {
              defaultValue: 'Search students, teachers, classes, fees',
            })}
            placeholderTextColor={palette.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
            // The only reason to be on this screen is to type, so the keyboard
            // should already be up rather than costing a second tap.
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => remember(query)}
            accessibilityLabel={t('placeholder', { defaultValue: 'Search' })}
          />
          {query ? (
            <AppIcon
              name="close-circle"
              size="md"
              color="onSurfaceVariant"
              onPress={() => setQuery('')}
              accessibilityLabel={t('clear', { defaultValue: 'Clear search' })}
            />
          ) : null}
        </View>
      </View>

      {!enabled ? (
        <RecentSearches
          recents={recents}
          onSelect={setQuery}
          onRemove={forget}
          onClearAll={clear}
        />
      ) : isInitialLoad ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={56} radius={12} />
          ))}
        </View>
      ) : totalHits === 0 ? (
        <EmptyState
          icon={<AppIcon name="search-outline" size="xl" color="onSurfaceVariant" />}
          title={t('empty.title', { defaultValue: 'No matches' })}
          description={t('empty.body', {
            query: debounced,
            defaultValue: `Nothing found for “${debounced}”.`,
          })}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.scrollBottomWithFooter }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            variant="labelSm"
            color="onSurfaceVariant"
            style={{ marginTop: spacing.md }}
          >
            {t('resultCount', {
              count: totalHits,
              query: debounced,
              defaultValue: `${totalHits} ${
                totalHits === 1 ? 'result' : 'results'
              } for “${debounced}”`,
            })}
          </Text>

          <SearchGroupSection
            title={t('group.students', { defaultValue: 'Students' })}
            count={results?.students.length ?? 0}
            showSeeAll={(results?.students.length ?? 0) >= 5}
            onSeeAll={() => seeAllWithQuery('/(protected)/students')}
          >
            {results?.students.map((s) => (
              <SearchResultRow
                key={s.id}
                icon="person-outline"
                primary={s.name ?? '—'}
                secondary={[s.admission_number, s.class_name].filter(Boolean).join(' · ') || null}
                highlight={debounced}
                onPress={() => go('/(protected)/students/[id]', s.id)}
              />
            ))}
          </SearchGroupSection>

          <SearchGroupSection
            title={t('group.teachers', { defaultValue: 'Teachers' })}
            count={results?.teachers.length ?? 0}
            showSeeAll={(results?.teachers.length ?? 0) >= 5}
            onSeeAll={() => seeAllWithQuery('/(protected)/teachers')}
          >
            {results?.teachers.map((tch) => (
              <SearchResultRow
                key={tch.id}
                icon="briefcase-outline"
                primary={tch.name ?? '—'}
                secondary={tch.employee_id}
                highlight={debounced}
                onPress={() => go('/(protected)/teachers/[id]', tch.id)}
              />
            ))}
          </SearchGroupSection>

          <SearchGroupSection
            title={t('group.classes', { defaultValue: 'Classes' })}
            count={results?.classes.length ?? 0}
            showSeeAll={(results?.classes.length ?? 0) >= 5}
            onSeeAll={() => seeAll('/(protected)/classes')}
          >
            {results?.classes.map((c) => (
              <SearchResultRow
                key={c.id}
                icon="school-outline"
                primary={[c.name, c.section].filter(Boolean).join(' - ') || '—'}
                highlight={debounced}
                onPress={() => go('/(protected)/classes/[id]', c.id)}
              />
            ))}
          </SearchGroupSection>

          <SearchGroupSection
            title={t('group.fees', { defaultValue: 'Fees' })}
            count={results?.fees.length ?? 0}
            showSeeAll={(results?.fees.length ?? 0) >= 5}
            onSeeAll={() => seeAll('/(protected)/finance/invoices')}
          >
            {results?.fees.map((f) => (
              <SearchResultRow
                key={f.id}
                icon="receipt-outline"
                primary={f.invoice_number ?? '—'}
                secondary={
                  [f.student_name, f.status ? humanise(f.status) : null]
                    .filter(Boolean)
                    .join(' · ') || null
                }
                highlight={debounced}
                onPress={() => go('/(protected)/finance/invoices/[id]', f.id)}
              />
            ))}
          </SearchGroupSection>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
