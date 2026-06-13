import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { DetailTabs } from '@/common/components/DetailTabs';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useTeacherQueue, useAdminFallbackQueue } from '../hooks/useStudentLeaves';
import { StudentLeaveRow } from '../components/StudentLeaveRow';
import type { StudentLeave } from '../types';

type Tab = 'new' | 'cancel';

export default function ApproveStudentLeavesScreen({
  embedded = false,
}: {
  /** When rendered inside the Leave approvals hub, the hub owns the back
   *  control + title, so this screen drops its own. */
  embedded?: boolean;
} = {}) {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius } = useTheme();
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
    router.push({ pathname: '/(protected)/student-leaves/[id]', params: { id: leave.id } } as never);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.marginMobile,
        paddingTop: embedded ? spacing.sm : spacing.lg,
      }}
    >
      {embedded ? null : (
        <>
          <AppIcon
            name="arrow-back"
            size="lg"
            color="onSurface"
            onPress={() => router.back()}
            accessibilityLabel={t('back', { defaultValue: 'Back' })}
          />
          <Text variant="display" color="onSurface" style={{ marginTop: spacing.xs }}>
            {t('queue.title', { defaultValue: 'Student leaves' })}
          </Text>
        </>
      )}

      {showAdminBanner ? (
        <View
          style={{
            backgroundColor: `${palette.warning}22`,
            padding: spacing.md,
            borderRadius: radius.lg,
            marginTop: spacing.md,
          }}
        >
          <Text variant="bodyMd" color="warning">
            {t('queue.adminBanner', { defaultValue: 'Showing requests where the class teacher is currently on leave.' })}
          </Text>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.md }}>
        <DetailTabs
          tabs={[
            { key: 'new', label: t('queue.tabNew', { defaultValue: 'New requests' }) },
            { key: 'cancel', label: t('queue.tabCancel', { defaultValue: 'Cancellation requests' }) },
          ]}
          active={tab}
          onChange={(k) => setTab(k as Tab)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StudentLeaveRow leave={item} onPress={handleRowPress} showStudentName />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !active.isLoading ? (
            <EmptyState
              icon={<AppIcon name="checkmark-done-outline" size="xl" color="onSurfaceVariant" />}
              title={t('queue.empty.title', { defaultValue: 'All clear' })}
              description={t('queue.empty.body', { defaultValue: 'No requests need your attention right now.' })}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={active.refetch} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      />
    </View>
  );
}
