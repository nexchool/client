import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { ScreenContainer } from '@/common/components/ScreenContainer';
import { EmptyState } from '@/common/components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useTeacherQueue, useAdminFallbackQueue } from '../hooks/useStudentLeaves';
import { StudentLeaveRow } from '../components/StudentLeaveRow';
import type { StudentLeave } from '../types';

type Tab = 'new' | 'cancel';

export default function ApproveStudentLeavesScreen() {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius, typography } = useTheme();
  const { isTeacher, isAdmin } = useUiRole();
  const [tab, setTab] = useState<Tab>('new');

  const teacherQuery = useTeacherQueue();
  const adminQuery = useAdminFallbackQueue();
  // Teacher view takes precedence if user is both a class teacher and an admin.
  const active = isTeacher ? teacherQuery : adminQuery;
  const showAdminBanner = !isTeacher && isAdmin;

  const all: StudentLeave[] = active.data ?? [];
  const filtered = tab === 'new'
    ? all.filter((l) => l.status === 'pending_class_teacher' || l.status === 'pending_admin')
    : all.filter((l) => l.cancel_requested_at != null);

  const handleRowPress = (leave: StudentLeave) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/(protected)/student-leaves/[id]', params: { id: leave.id } } as any);
  };

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 44, height: 44, justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={24} color={palette.onSurface} />
      </Pressable>

      <Text style={[typography.display, { color: palette.onSurface, marginTop: spacing.xs }]}>
        {t('queue.title', { defaultValue: 'Student leaves' })}
      </Text>

      {showAdminBanner ? (
        <View style={{ backgroundColor: `${palette.warning}22`, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.md }}>
          <Text style={[typography.bodyMd, { color: palette.warning }]}>
            {t('queue.adminBanner', { defaultValue: 'Showing requests where the class teacher is currently on leave.' })}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
        {(['new', 'cancel'] as Tab[]).map((tk) => {
          const labelKey = tk === 'new' ? 'queue.tabNew' : 'queue.tabCancel';
          const labelDefault = tk === 'new' ? 'New requests' : 'Cancellation requests';
          const activeT = tab === tk;
          return (
            <Pressable
              key={tk}
              onPress={() => setTab(tk)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: activeT ? palette.tertiaryContainer : palette.surfaceContainerLowest,
                borderWidth: activeT ? 0 : 1,
                borderColor: palette.outlineVariant,
                opacity: pressed ? 0.85 : 1,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={[typography.labelMd, { color: activeT ? palette.onTertiaryContainer : palette.onSurface }]}>
                {t(labelKey, { defaultValue: labelDefault })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        style={{ marginTop: spacing.lg }}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StudentLeaveRow leave={item} onPress={handleRowPress} showStudentName />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !active.isLoading ? (
            <EmptyState
              icon={<Ionicons name="checkmark-done-outline" size={28} color={palette.onSurfaceVariant} />}
              title={t('queue.empty.title', { defaultValue: 'All clear' })}
              description={t('queue.empty.body', { defaultValue: 'No requests need your attention right now.' })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={active.refetch} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </ScreenContainer>
  );
}
