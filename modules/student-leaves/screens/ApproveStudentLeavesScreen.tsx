import React, { useMemo, useState } from 'react';
import { SectionList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { AppIcon } from '@/common/components/AppIcon';
import { EmptyState } from '@/common/components/EmptyState';
import { DetailTabs } from '@/common/components/DetailTabs';
import { PageHeader } from '@/common/components/PageHeader';
import { SearchFilterBar } from '@/common/components/SearchFilterBar';
import { Skeleton } from '@/common/components/Skeleton';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useTeacherQueue, useAdminFallbackQueue } from '../hooks/useStudentLeaves';
import { StudentLeaveRow } from '../components/StudentLeaveRow';
import { queueReasonKey } from '../constants';
import type { StudentLeave } from '../types';

type Tab = 'new' | 'cancel';

/** A head's queue holds two different jobs, and they are not equally urgent. */
const REASON_ORDER = ['awaiting_head', 'no_class_teacher', 'teacher_away'] as const;

export default function ApproveStudentLeavesScreen({
  embedded = false,
}: {
  /** When rendered inside the Leave approvals hub, the hub owns the back
   *  control + title, so this screen drops its own. */
  embedded?: boolean;
} = {}) {
  const { t } = useTranslation('studentLeaves');
  const { spacing, radius } = useTheme();
  const { isTeacher, isAdmin } = useUiRole();
  const [tab, setTab] = useState<Tab>('new');
  const [search, setSearch] = useState('');

  const teacherQuery = useTeacherQueue();
  const adminQuery = useAdminFallbackQueue();
  // Teacher view takes precedence if user is both a class teacher and an admin.
  const active = isTeacher ? teacherQuery : adminQuery;
  const isHeadView = !isTeacher && isAdmin;

  const queueRows = active.data;

  const sections = useMemo(() => {
    const all: StudentLeave[] = queueRows ?? [];
    const term = search.trim().toLowerCase();
    const matches = (leave: StudentLeave) => {
      if (!term) return true;
      const name = leave.applicant?.display_name ?? leave.student_name ?? '';
      const admission = leave.applicant?.admission_number ?? leave.admission_number ?? '';
      return (
        name.toLowerCase().includes(term) || admission.toLowerCase().includes(term)
      );
    };

    const inTab = all.filter((leave) =>
      tab === 'new'
        ? leave.status === 'pending_class_teacher' || leave.status === 'pending_admin'
        : leave.cancel_requested_at != null,
    );
    const visible = inTab.filter(matches);

    // A class teacher's own queue is one job, so it stays one list.
    if (!isHeadView || tab === 'cancel') {
      return visible.length
        ? [{ title: '', data: visible }]
        : [];
    }

    // A head is shown why each request is in front of them: a request the
    // school's rule sent up is theirs to decide, one where the class teacher
    // is away is theirs to cover. Lumping them together hides which is which.
    return REASON_ORDER.map((reason) => ({
      title: t(queueReasonKey(reason)),
      data: visible.filter((leave) => (leave.queue_reason ?? 'teacher_away') === reason),
    })).filter((section) => section.data.length > 0);
  }, [queueRows, tab, search, isHeadView, t]);

  const handleRowPress = (leave: StudentLeave) => {
    router.push({ pathname: '/(protected)/student-leaves/[id]', params: { id: leave.id } } as never);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.marginMobile,
        paddingTop: embedded ? spacing.sm : 0,
      }}
    >
      {embedded ? null : (
        <PageHeader
          title={t('queue.title', { defaultValue: 'Student leaves' })}
          onBack={() => router.back()}
          backLabel={t('back', { defaultValue: 'Back' })}
          noHorizontalPadding
          divider={false}
        />
      )}

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

      {/* A head at a trust can face a long queue; a class teacher rarely can,
          but the bar costs nothing and behaves the same either way. */}
      <View style={{ marginTop: spacing.md }}>
        <SearchFilterBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('search.placeholder', {
            defaultValue: 'Search by name or admission no.',
          })}
        />
      </View>

      {active.isLoading ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={120} radius={radius.xl} />
          ))}
        </View>
      ) : (
        <SectionList
          style={{ marginTop: spacing.md }}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <Text
                variant="labelMd"
                color="onSurfaceVariant"
                style={{ paddingTop: spacing.md, paddingBottom: spacing.sm }}
              >
                {section.title}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <StudentLeaveRow leave={item} onPress={handleRowPress} showStudentName />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon={<AppIcon name="checkmark-done-outline" size="xl" color="onSurfaceVariant" />}
              title={
                search.trim()
                  ? t('queue.noMatch.title', { defaultValue: 'No matching requests' })
                  : t('queue.empty.title', { defaultValue: 'All clear' })
              }
              description={
                search.trim()
                  ? t('queue.noMatch.body', {
                      defaultValue: 'No request matches that name or admission number.',
                    })
                  : t('queue.empty.body', {
                      defaultValue: 'No requests need your attention right now.',
                    })
              }
            />
          }
          refreshControl={
            <RefreshControl refreshing={active.isRefetching} onRefresh={active.refetch} />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
        />
      )}
    </View>
  );
}
