// client/modules/student-leaves/screens/StudentLeavesScreen.tsx
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { PageHeader } from '@/common/components/PageHeader';
import { Skeleton } from '@/common/components/Skeleton';
import { FilterChips } from '@/common/components/FilterChips';
import { useMyStudentLeaves } from '../hooks/useStudentLeaves';
import { StudentLeaveRow } from '../components/StudentLeaveRow';
import type { LeaveStatus, StudentLeave } from '../types';

/**
 * `pending` is not a stored status — it is the word a school uses for both
 * waiting stages, and the API expands it. Sending `pending_class_teacher`
 * here meant a request that had moved on to the principal vanished from the
 * applicant's own list while it was very much alive.
 */
type Filter = 'all' | 'pending' | LeaveStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function StudentLeavesScreen() {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius, elevation } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyStudentLeaves(filter === 'all' ? undefined : filter);

  const leaves = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const handleRowPress = (leave: StudentLeave) => {
    router.push({ pathname: '/(protected)/student-leaves/[id]', params: { id: leave.id } } as never);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
      <PageHeader
        title={t('list.title', { defaultValue: 'My leaves' })}
        noHorizontalPadding
        divider={false}
      />

      <View style={{ marginTop: spacing.md }}>
        <FilterChips
          options={FILTERS.map((f) => ({
            value: f.value,
            label: t(`filter.${f.value}`, { defaultValue: f.label }),
          }))}
          value={filter}
          onChange={setFilter}
        />
      </View>

      <FlatList
        style={{ marginTop: spacing.lg }}
        data={leaves}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StudentLeaveRow leave={item} onPress={handleRowPress} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          isLoading ? (
            // Three card-shaped placeholders, so the first load reads as
            // "loading" rather than as "you have never applied for leave".
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} width="100%" height={120} radius={radius.xl} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<AppIcon name="calendar-outline" size="xl" color="onSurfaceVariant" />}
              title={t('list.empty.title', { defaultValue: 'No leaves yet' })}
              description={t('list.empty.body', { defaultValue: 'When you apply for a leave, it will show up here.' })}
              action={{
                label: t('list.newA11y', { defaultValue: 'Apply for leave' }),
                onPress: () => router.push('/(protected)/student-leaves/new' as never),
              }}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('list.newA11y', { defaultValue: 'Apply for leave' })}
        onPress={() => router.push('/(protected)/student-leaves/new' as never)}
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
    </View>
  );
}
