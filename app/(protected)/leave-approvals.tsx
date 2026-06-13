import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { BackHeader } from '@/common/components/BackHeader';
import { DetailTabs } from '@/common/components/DetailTabs';
import { EmptyState } from '@/common/components/EmptyState';
import { AppIcon } from '@/common/components/AppIcon';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions';
import * as PERMS from '@/modules/permissions/constants/permissions';
import ApproveStudentLeavesScreen from '@/modules/student-leaves/screens/ApproveStudentLeavesScreen';
import TeacherLeavesScreen from '@/modules/teacher-leaves/screens/TeacherLeavesScreen';

/**
 * Leave approvals hub — unifies the two approval queues (students + teachers)
 * under one role/permission-gated tabbed screen, and gives the previously
 * orphaned /teacher-leaves route a home. Personal "My leaves" stays separate
 * (different activity). Each queue renders in `embedded` mode so this hub owns
 * the back control + title while the queues keep their own filters and actions.
 */

type TabKey = 'students' | 'teachers';

export default function LeaveApprovalsScreen() {
  const { t } = useTranslation('studentLeaves');
  const router = useRouter();
  const { palette, spacing } = useTheme();
  const { isTeacher, isAdmin } = useUiRole();
  const { hasPermission } = usePermissions();

  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string }[] = [];
    // Student-queue visibility mirrors ApproveStudentLeavesScreen's own gate so
    // a visible tab never renders an empty/unauthorized body.
    if (isTeacher || isAdmin) {
      list.push({ key: 'students', label: t('approvals.students', { defaultValue: 'Students' }) });
    }
    if (hasPermission(PERMS.TEACHER_LEAVE_MANAGE)) {
      list.push({ key: 'teachers', label: t('approvals.teachers', { defaultValue: 'Teachers' }) });
    }
    return list;
  }, [isTeacher, isAdmin, hasPermission, t]);

  const [active, setActive] = useState<TabKey | null>(null);
  const current = active ?? tabs[0]?.key ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.surface }}>
      <BackHeader
        title={t('approvals.title', { defaultValue: 'Leave approvals' })}
        onBack={() => router.back()}
      />
      {tabs.length === 0 ? (
        <EmptyState
          icon={<AppIcon name="lock-closed-outline" size="xl" color="onSurfaceVariant" />}
          title={t('approvals.noAccess', { defaultValue: 'No approvals to manage' })}
          description={t('approvals.noAccessBody', {
            defaultValue: 'Your role does not approve student or teacher leave requests.',
          })}
        />
      ) : (
        <>
          {tabs.length > 1 ? (
            <View style={{ paddingHorizontal: spacing.marginMobile, paddingTop: spacing.sm }}>
              <DetailTabs
                tabs={tabs}
                active={current ?? tabs[0].key}
                onChange={(k) => setActive(k as TabKey)}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            {current === 'students' ? <ApproveStudentLeavesScreen embedded /> : null}
            {current === 'teachers' ? <TeacherLeavesScreen embedded /> : null}
          </View>
        </>
      )}
    </View>
  );
}
