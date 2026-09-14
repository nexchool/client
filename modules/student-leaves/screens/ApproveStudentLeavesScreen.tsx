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

  // A head who also teaches a class has work in both queues, and
  // `resolveUiRole` is mutually exclusive with Admin winning — so picking one
  // queue by role hid a principal's own class-teacher requests from them
  // entirely. Small schools where the principal holds a class are the common
  // case, not the exception.
  const teacherQuery = useTeacherQueue(isTeacher || isAdmin);
  const adminQuery = useAdminFallbackQueue(isAdmin);
  const isHeadView = isAdmin;

  const teacherRows = teacherQuery.data;
  const adminRows = adminQuery.data;

  // Either query may 403 for someone holding only one of the two permissions.
  // That is not an error worth a screen for — it means "no work of that kind",
  // which is why neither retries. A disabled query reports isLoading false, so
  // this waits only on the ones that actually apply to this person.
  const isLoading = teacherQuery.isLoading || adminQuery.isLoading;
  const isRefetching = teacherQuery.isRefetching || adminQuery.isRefetching;

  // A 403 on one queue means "no work of that kind" and is ignored. Every
  // queue this person actually has failing is a different thing, and must not
  // be reported as "All clear" — a principal reading that puts their phone
  // down with requests still waiting.
  const myQueues = [
    isTeacher || isAdmin ? teacherQuery : null,
    isAdmin ? adminQuery : null,
  ].filter((q): q is NonNullable<typeof q> => q != null);
  const everyQueueFailed = myQueues.length > 0 && myQueues.every((q) => q.isError);
  const refetch = () => {
    teacherQuery.refetch();
    adminQuery.refetch();
  };

  const sections = useMemo(() => {
    // The same leave can sit in both queues — a head standing in for an absent
    // teacher whose class is also their own. Show it once.
    const byId = new Map<string, StudentLeave>();
    for (const leave of [...(teacherRows ?? []), ...(adminRows ?? [])]) {
      byId.set(leave.id, leave);
    }
    const all: StudentLeave[] = [...byId.values()];
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
  }, [teacherRows, adminRows, tab, search, isHeadView, t]);

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

      {isLoading ? (
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
            everyQueueFailed ? (
              <EmptyState
                icon={<AppIcon name="cloud-offline-outline" size="xl" color="error" />}
                title={t('queue.failed.title', { defaultValue: 'Could not load requests' })}
                description={t('queue.failed.body', {
                  defaultValue:
                    'There may be requests waiting. Check your connection and try again.',
                })}
                action={{
                  label: t('queue.failed.retry', { defaultValue: 'Try again' }),
                  onPress: refetch,
                }}
              />
            ) : (
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
            )
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}
        />
      )}
    </View>
  );
}
