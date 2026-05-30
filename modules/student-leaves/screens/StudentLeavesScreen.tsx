// client/modules/student-leaves/screens/StudentLeavesScreen.tsx
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { useMyStudentLeaves } from '../hooks/useStudentLeaves';
import { StudentLeaveRow } from '../components/StudentLeaveRow';
import type { LeaveStatus, StudentLeave } from '../types';

type Filter = 'all' | LeaveStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending_class_teacher', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function StudentLeavesScreen() {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius, elevation } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: leaves = [], isLoading, refetch, isRefetching } = useMyStudentLeaves(
    filter === 'all' ? undefined : filter,
  );

  const handleRowPress = (leave: StudentLeave) => {
    router.push({ pathname: '/(protected)/student-leaves/[id]', params: { id: leave.id } } as never);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg }}>
      <Text variant="display" color="onSurface">
        {t('list.title', { defaultValue: 'My leaves' })}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: active ? palette.tertiaryContainer : palette.surfaceContainerLowest,
                borderWidth: active ? 0 : 1,
                borderColor: palette.outlineVariant,
                opacity: pressed ? 0.85 : 1,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text variant="labelMd" color={active ? 'onTertiaryContainer' : 'onSurface'}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        style={{ marginTop: spacing.lg }}
        data={leaves}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StudentLeaveRow leave={item} onPress={handleRowPress} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<AppIcon name="calendar-outline" size="xl" color="onSurfaceVariant" />}
              title={t('list.empty.title', { defaultValue: 'No leaves yet' })}
              description={t('list.empty.body', { defaultValue: 'When you apply for a leave, it will show up here.' })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl * 3 }}
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
