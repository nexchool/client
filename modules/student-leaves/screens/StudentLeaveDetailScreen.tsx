// client/modules/student-leaves/screens/StudentLeaveDetailScreen.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Skeleton } from '@/common/components/Skeleton';
import { Button } from '@/common/components/Button';
import { PageHeader } from '@/common/components/PageHeader';
import { StatusPill } from '@/common/components/StatusPill';
import { DetailCard } from '@/common/components/DetailCard';
import { DetailRow } from '@/common/components/DetailRow';
import { formatDate } from '@/common/utils/datetime';
import { useUiRole } from '@/modules/permissions/hooks/useUiRole';
import { useStudentLeave } from '../hooks/useStudentLeaves';
import { ApplicantCard } from '../components/ApplicantCard';
import { ApprovalTrailCard } from '../components/ApprovalTrailCard';
import { ApproveLeaveActions } from '../components/ApproveLeaveActions';
import { ApproveCancelActions } from '../components/ApproveCancelActions';
import { statusAccent, statusLabelKey } from '../constants';

export default function StudentLeaveDetailScreen() {
  const { t } = useTranslation('studentLeaves');
  const { palette, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isStudent, isTeacher, isAdmin } = useUiRole();
  const detail = useStudentLeave(id);

  if (detail.isLoading || !detail.data) {
    return (
      <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile, gap: spacing.md }}>
        <Skeleton width="60%" height={32} radius={radius.md} />
        <Skeleton width="100%" height={160} radius={radius.lg} />
        <Skeleton width="100%" height={200} radius={radius.lg} />
      </View>
    );
  }

  const leave = detail.data;
  const accent = statusAccent(leave.status);
  const canApproveLeave =
    (isTeacher || isAdmin) &&
    (leave.status === 'pending_class_teacher' || leave.status === 'pending_admin');
  const canApproveCancel = (isTeacher || isAdmin) && !!leave.cancel_requested_at;
  const canRequestCancel =
    isStudent &&
    !leave.cancel_requested_at &&
    leave.status !== 'cancelled' &&
    leave.status !== 'rejected';

  // Calendar dates through the school clock — `new Date(iso)` on a plain
  // `YYYY-MM-DD` shows the previous day for anyone west of the school.
  const dateRange = `${formatDate(leave.start_date)} – ${formatDate(leave.end_date)}${
    leave.half_day ? ` (${leave.half_day.toUpperCase()})` : ''
  }`;

  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.marginMobile }}>
      <PageHeader
        title={`${leave.leave_type} ${t('detail.leaveSuffix', { defaultValue: 'leave' })}`}
        onBack={() => router.back()}
        backLabel={t('back', { defaultValue: 'Back' })}
        right={<StatusPill label={t(statusLabelKey(leave.status))} tone={accent} />}
        noHorizontalPadding
        divider={false}
      />

      <ScrollView
        contentContainerStyle={{
          gap: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.scrollBottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Who applied — only somebody deciding the request is shown this, and
            the server only sends it to them. */}
        {leave.applicant ? <ApplicantCard applicant={leave.applicant} /> : null}

        <DetailCard title={t('detail.cardTitle', { defaultValue: 'Leave details' })} accent={accent}>
          <DetailRow
            icon="calendar-outline"
            label={t('detail.dates', { defaultValue: 'Dates' })}
            value={dateRange}
          />
          <DetailRow
            icon="document-text-outline"
            label={t('detail.reason', { defaultValue: 'Reason' })}
            value={leave.reason}
          />
        </DetailCard>

        <ApprovalTrailCard leave={leave} />

        {leave.rejection_reason ? (
          <View
            style={{
              backgroundColor: `${palette.error}22`,
              padding: spacing.md,
              borderRadius: radius.lg,
            }}
          >
            <Text variant="labelSm" color="error">
              {t('detail.rejectedReason', { defaultValue: 'Rejected:' })}
            </Text>
            <Text variant="bodyMd" color="error">
              {leave.rejection_reason}
            </Text>
          </View>
        ) : null}

        {leave.cancel_requested_at ? (
          <View
            style={{
              backgroundColor: `${palette.warning}22`,
              padding: spacing.md,
              borderRadius: radius.lg,
            }}
          >
            <Text variant="bodyMd" color="warning">
              {t('detail.cancelPending', {
                defaultValue: 'Cancellation is awaiting class teacher review.',
              })}
            </Text>
            {leave.cancel_requested_reason ? (
              <Text variant="labelSm" color="warning" style={{ marginTop: spacing.xs }}>
                {leave.cancel_requested_reason}
              </Text>
            ) : null}
          </View>
        ) : null}

        {canApproveLeave ? <ApproveLeaveActions leaveId={leave.id} /> : null}
        {canApproveCancel ? <ApproveCancelActions leaveId={leave.id} /> : null}

        {canRequestCancel ? (
          <Button
            variant="ghost"
            fullWidth
            onPress={() =>
              router.push({
                pathname: '/(protected)/student-leaves/cancel/[id]',
                params: { id: leave.id },
              } as never)
            }
          >
            {t('detail.requestCancel', { defaultValue: 'Request cancellation' })}
          </Button>
        ) : null}
      </ScrollView>
    </View>
  );
}
