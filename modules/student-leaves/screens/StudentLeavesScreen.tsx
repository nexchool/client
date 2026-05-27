// client/modules/student-leaves/screens/StudentLeavesScreen.tsx
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
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
  const { palette, spacing, radius, typography, elevation } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: leaves = [], isLoading, refetch, isRefetching } = useMyStudentLeaves(
    filter === 'all' ? undefined : filter,
  );

  const handleRowPress = (leave: StudentLeave) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/(protected)/student-leaves/[id]', params: { id: leave.id } } as any);
  };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[typography.display, { color: palette.onSurface }]}>
          {t('list.title', { defaultValue: 'My leaves' })}
        </Text>
      </View>

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
              <Text
                style={[typography.labelMd, { color: active ? palette.onTertiaryContainer : palette.onSurface }]}
              >
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
              icon={<Ionicons name="calendar-outline" size={28} color={palette.onSurfaceVariant} />}
              title={t('list.empty.title', { defaultValue: 'No leaves yet' })}
              description={t('list.empty.body', { defaultValue: 'When you apply for a leave, it will show up here.' })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Apply for leave"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onPress={() => router.push('/(protected)/student-leaves/new' as any)}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: 96,
          right: 20,
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
        <Ionicons name="add" size={28} color={palette.onPrimary} />
      </Pressable>
    </ScreenContainer>
  );
}
