// client/modules/student-leaves/components/ApprovalTrailCard.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import { formatDate } from '@/common/utils/datetime';
import type { StudentLeave } from '../types';

type Props = {
  leave: StudentLeave;
};

/**
 * Who agreed, and when.
 *
 * A school that asks for two signatures wants to see both. `decided_by` alone
 * could not show that: it holds whoever acted last, so the principal's
 * decision used to erase the class teacher's.
 */
export function ApprovalTrailCard({ leave }: Props) {
  const { t } = useTranslation('studentLeaves');

  const teacherValue = leave.class_teacher_decided_by_name
    ? `${leave.class_teacher_decided_by_name} · ${formatDate(leave.class_teacher_decided_at)}`
    : t('trail.awaiting');

  // Only a leave that was routed through the principal has a second stage to
  // report. For every other leave the class teacher's word was the decision.
  if (!leave.requires_admin_approval) {
    return (
      <DetailCard title={t('trail.title')}>
        <DetailRow
          icon="person-outline"
          label={t('trail.classTeacher')}
          value={teacherValue}
        />
      </DetailCard>
    );
  }

  const principalValue =
    leave.status === 'pending_admin'
      ? t('trail.awaiting')
      : leave.decided_by_name
        ? `${leave.decided_by_name} · ${formatDate(leave.decided_at)}`
        : t('trail.awaiting');

  return (
    <DetailCard title={t('trail.title')}>
      <DetailRow
        icon="person-outline"
        label={t('trail.classTeacher')}
        value={teacherValue}
      />
      <DetailRow
        icon="shield-checkmark-outline"
        label={t('trail.principal')}
        value={principalValue}
      />
    </DetailCard>
  );
}
